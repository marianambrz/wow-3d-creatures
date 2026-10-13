# Backend

## Local development with SQLite

In development, the sign-in and account screens use the local SQLite API by
default. No PostgreSQL or Neon connection is needed for those operations. Open
two terminals at the project root:

1. Run `npm run dev:api` to start the API on `http://127.0.0.1:3000`. It creates
   `animal.db` and `.secret` in the project root on first start.
2. Run `npm run dev` to start the frontend at `http://127.0.0.1:5173`.

SQLite local mode supports account registration, sign-in, session lookup, and
account deletion. Email-based password recovery requires the production email
service and is unavailable in this local mode. Set `VITE_USE_SQLITE=false` to
use Better Auth/PostgreSQL during local frontend development instead. The
SQLite API remains a local development backend; production on Vercel uses the
PostgreSQL setup below.

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

## Deploying the backend with Vercel and Neon

The root `vercel.json` already runs `npm ci` and `npm run build`. The Vite
configuration selects Nitro's Vercel preset, which packages the TanStack Start
server routes as Vercel Functions. Do not deploy `server.js`; it is a separate,
legacy SQLite API.

1. Create a Neon project and copy its **pooled** PostgreSQL connection string.
   Keep the SSL query parameters provided by Neon. Use a separate Neon branch
   for Preview deployments if you want to keep preview data out of Production.
2. Import this Git repository into Vercel. Keep the project root as the Root
   Directory and use the existing install and build commands from `vercel.json`.
3. In Vercel Project Settings → Environment Variables, add these for Production
   and Preview (and Development if using `vercel dev`):
   - `DATABASE_URL`: Neon pooled connection string. Use the matching Neon
     branch for each environment.
   - `APP_ORIGIN`: the exact production URL, including `https://` and without a
     trailing slash (for example, `https://your-domain.vercel.app`).
   - `BETTER_AUTH_SECRET`: a unique random secret of at least 32 characters.
   - Optional: `RESEND_API_KEY` and `RESEND_FROM_EMAIL` for password recovery;
     `OPENAI_API_KEY` and `OPENAI_MODEL` for the assistant.
4. Enable Vercel System Environment Variables so Preview functions can read
   `VERCEL_ENV` and `VERCEL_URL`. Auth uses each Preview deployment's generated
   HTTPS URL, while Production uses `APP_ORIGIN` and also accepts its generated
   deployment URL.
5. Apply the Drizzle migrations to the Neon database before the first deploy:
   configure the same `DATABASE_URL` locally, then run `npm run db:migrate`.
   Apply migrations separately to the Preview Neon branch if you created one.
6. Deploy from the Vercel dashboard or push to the connected Git branch. A new
   deployment is required after changing environment variables.

The deployment requires the Node.js runtime and outbound PostgreSQL access.
The account and data are stored in Neon, not in Vercel's function filesystem.

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
