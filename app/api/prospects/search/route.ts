import { NextResponse } from "next/server";
import { z } from "zod";
import {
  calculateProspectScore,
  getSearchArea,
  getTargetCategory,
  priorityLabel
} from "@/lib/prospecting";
import { getSupabaseAdmin, prospectsTable } from "@/lib/supabase";

export const runtime = "nodejs";

const SearchSchema = z.object({
  token: z.string(),
  categoryId: z.string(),
  areaId: z.string(),
  limit: z.number().int().min(1).max(20).default(20)
});

type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  rating?: number;
  userRatingCount?: number;
  businessStatus?: string;
  types?: string[];
};

export async function POST(request: Request) {
  try {
    const input = SearchSchema.parse(await request.json());
    if (input.token !== (process.env.ADMIN_TOKEN || "admin-edilizia")) {
      return NextResponse.json({ error: "Token admin non valido" }, { status: 401 });
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Aggiungi GOOGLE_PLACES_API_KEY nelle variabili ambiente di Vercel." },
        { status: 503 }
      );
    }

    const category = getTargetCategory(input.categoryId);
    const area = getSearchArea(input.areaId);
    if (!category || !area) {
      return NextResponse.json({ error: "Categoria o territorio non valido" }, { status: 400 });
    }

    const results = new Map<string, GooglePlace>();
    for (const term of category.queries) {
      if (results.size >= input.limit) break;

      const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.googleMapsUri,places.rating,places.userRatingCount,places.businessStatus,places.types"
        },
        body: JSON.stringify({
          textQuery: `${term} ${area.suffix}`,
          languageCode: "it",
          regionCode: "IT",
          pageSize: Math.min(20, input.limit)
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        return NextResponse.json(
          { error: payload?.error?.message || "Ricerca Google Places non riuscita" },
          { status: response.status }
        );
      }

      for (const place of (payload.places || []) as GooglePlace[]) {
        if (place.id && !results.has(place.id)) results.set(place.id, place);
        if (results.size >= input.limit) break;
      }
    }

    const prospects = Array.from(results.values()).map((place) => {
      const score = calculateProspectScore({
        tier: category.tier,
        areaId: input.areaId,
        website: place.websiteUri,
        phone: place.nationalPhoneNumber,
        rating: place.rating,
        reviews: place.userRatingCount
      });

      return {
        place_id: place.id,
        company: place.displayName?.text || "Azienda senza nome",
        category_id: category.id,
        category_label: category.label,
        target_tier: category.tier,
        area_id: input.areaId,
        address: place.formattedAddress || "",
        phone: place.nationalPhoneNumber || "",
        website: place.websiteUri || "",
        maps_url: place.googleMapsUri || "",
        rating: place.rating || null,
        reviews_count: place.userRatingCount || 0,
        score,
        priority: priorityLabel(score),
        status: "new",
        qualification_notes: category.signals.join(", "),
        source: "google_places",
        raw_data: place,
        updated_at: new Date().toISOString()
      };
    });

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase non configurato: impossibile salvare i prospect." },
        { status: 503 }
      );
    }

    const { data, error } = await supabase
      .from(prospectsTable())
      .upsert(prospects, { onConflict: "place_id" })
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ found: prospects.length, prospects: data || prospects });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Errore interno";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
