# Backend

The app uses TanStack Start route handlers, Better Auth sessions, PostgreSQL,
and Drizzle ORM. Auth routes are mounted at `/api/auth/$`; the authenticated
profile endpoint is `/api/profile`. Every profile operation uses the user ID
from the verified server session, never an ID supplied by the browser.

## Local setup

1. Copy `.env.example` to `.env` and set a random `BETTER_AUTH_SECRET` of at
   least 32 characters.
2. For Neon, set `DATABASE_URL` to the pooled connection string from the Neon
   dashboard. Keep `sslmode=require` and `channel_binding=require` in the query
   string. For local PostgreSQL, start the database with `docker compose up -d db`.
3. Run `npm run db:migrate` to apply the checked-in migrations. After changing
   the schema, run `npm run db:generate` and then `npm run db:migrate`.
4. Start the app with `npm run dev`.

`APP_ORIGIN` must match the public origin exactly. Password recovery requires
`RESEND_API_KEY` and `RESEND_FROM_EMAIL`; until those are configured, the app
cannot deliver reset links. `/api/health` is intentionally independent of the
database and does not expose credentials.

The animal assistant uses the OpenAI Responses API from the server. Add
`OPENAI_API_KEY` to `.env` (optionally set `OPENAI_MODEL`) and restart the app.
The browser never receives the API key. Assistant requests require a signed-in
session and are limited to 10 per minute per account. The question, animal
species, and up to 10 recent observations are sent to OpenAI; avoid entering
personal identifying details. The assistant is informational and cannot
diagnose or prescribe treatment.

The current profile API stores one animal profile per account, matching the
existing single-animal UI. The schema supports diary and vaccination records
as separate related tables. The veterinarian role and CRMV value are
informational and are not validated against a council registry.

The production build targets Vercel's Node.js runtime. The PostgreSQL driver
uses `postgres.js` over TCP, so the runtime needs outbound PostgreSQL access;
use Neon's pooled connection string. The separate static Pages build does not
host this backend.
