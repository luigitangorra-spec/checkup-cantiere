# Checkup Cantiere

Web app Next.js per `checkupcantiere.it`: checkup digitale per imprese edili con form lead, quiz a 7 domande, score 0-100, report PDF, invio email, Calendly embed, Meta Pixel, Google Analytics e pannello admin.

## Stack

- Next.js App Router
- Supabase per database lead
- PDFKit per report PDF
- Resend o Brevo per email transazionali
- Calendly embed per prenotazioni
- Meta Pixel e Google Analytics tramite variabili ambiente

## Avvio locale

```bash
npm install
cp .env.example .env.local
npm run dev
```

Apri:

- Test pubblico: `http://localhost:3000`
- Admin: `http://localhost:3000/admin?token=admin-edilizia`

## Dominio

Configura il deploy con dominio:

```bash
NEXT_PUBLIC_SITE_URL="https://checkupcantiere.it"
```

## Supabase

1. Crea un progetto Supabase.
2. Esegui lo script `supabase.sql` nel SQL editor.
3. Inserisci in `.env.local`:

```bash
SUPABASE_URL="https://..."
SUPABASE_SERVICE_ROLE_KEY="..."
SUPABASE_LEADS_TABLE="leads"
```

La service role key deve restare solo lato server.

## Email

Per Resend:

```bash
EMAIL_PROVIDER="resend"
EMAIL_FROM="report@checkupcantiere.it"
RESEND_API_KEY="..."
```

Per Brevo:

```bash
EMAIL_PROVIDER="brevo"
EMAIL_FROM="report@checkupcantiere.it"
BREVO_API_KEY="..."
```

Se le chiavi email non sono configurate, il lead viene comunque salvato e lo stato email sara `email_not_configured`.

## Tracking e Calendly

```bash
NEXT_PUBLIC_CALENDLY_URL="https://calendly.com/checkupcantiere/consulenza"
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-..."
NEXT_PUBLIC_META_PIXEL_ID="..."
ADMIN_TOKEN="token-sicuro"
```

Quando il test viene completato, la pagina invia un evento `generate_lead` a GA e un evento `Lead` a Meta Pixel.
