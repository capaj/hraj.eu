# hraj.eu

[hraj.eu](https://hraj.eu) helps amateur players find people to play sports with and organize games. Players can discover events and venues, join games or waitlists, and set their sport preferences and skill levels. Organizers can manage player capacity, guests, groups of regular players, payment instructions, and event updates.

The app includes event comments, venue and city event subscriptions, calendar exports, profiles, and a karma leaderboard. The interface supports Czech and English, with Czech selected by default.

## Stack and repository layout

This is a pnpm workspace with a React 19 / TypeScript web app and a separate scheduled worker. Both run on Cloudflare Workers and share a Turso (SQLite/libSQL) database through Drizzle ORM.

| Path | Purpose |
| --- | --- |
| `web-app/src/routes/` | TanStack Router file routes, route loaders, API routes, and development scenarios |
| `web-app/src/pages/` | Page-level UI |
| `web-app/src/components/` | Components organized by feature; shared UI primitives in `ui/` |
| `web-app/src/server-functions/` | TanStack Start server functions, validation, permissions, and business logic |
| `web-app/src/lib/` | Authentication, localization, constants, and shared helpers |
| `web-app/src/utils/` | Utilities such as participant limits and calendar exports |
| `web-app/drizzle/` | Shared database client, application/auth schemas, and SQL migrations |
| `web-app/app/locales/` | Lingui translation catalogs and compiled messages |
| `web-app/tests/` | Web app tests using Node's test runner through `tsx` |
| `cron/src/` | Hourly event processing and email notifications; Vitest tests |
| `scripts/` | Repository automation, including translation tooling |

The web app uses TanStack Start for server rendering and server functions, TanStack Query for server state, Tailwind CSS v4 and Radix UI for styling/components, and Better Auth for email/password, magic-link, Google, and Facebook sign-in. Resend delivers email; Cloudflare R2 stores uploads. Maps use Leaflet, with Google Maps services for address lookup.

## Getting started

### Prerequisites

- Node.js 24, matching [`.nvmrc`](.nvmrc).
- pnpm 11.3.0, matching the root `packageManager` field.
- For database-backed workflows, access to a development Turso database with the project schema already applied. Ask a maintainer for provisioning and service credentials; installation does not initialize a database.

Run commands from the repository root unless noted otherwise:

```sh
nvm use
cp web-app/.dev.vars.example web-app/.dev.vars
pnpm install
```

Edit `web-app/.dev.vars` before starting the app. It is ignored by Git. The example contains placeholders, so copying it alone does not provide a working database or external services.

| Variable | Configuration |
| --- | --- |
| `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` | Development database URL and token; required for database-backed pages and authentication |
| `BETTER_AUTH_SECRET` | A private, randomly generated authentication secret |
| `BETTER_AUTH_URL` | Set to `http://localhost:5173` for local development |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Development OAuth credentials for Google sign-in |
| `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET` | Development OAuth credentials for Facebook sign-in |
| `RESEND_API_KEY`, `SENDER_EMAIL` | Email credentials and a sender authorized for your Resend setup |
| `GOOGLE_MAPS_API_KEY` | Address autocomplete/geocoding; the app exposes this key to the browser, so configure appropriate restrictions |

The checked-in example currently uses port 3000 for `BETTER_AUTH_URL`; change it to 5173 to match Vite and the local trusted origin in `src/lib/auth.ts`. OAuth provider configuration must also allow your local callback URLs.

**Development bindings need attention:** [the web app Wrangler config](web-app/wrangler.jsonc) contains production defaults, including the database URL and an R2 upload binding with `remote: true`. Override the database and auth URL in `.dev.vars`. For upload work, arrange a development bucket or a local binding (`remote: false`) before uploading; the checked-in binding accesses remote storage. Do not commit credentials or personal configuration changes.

Start the web app:

```sh
pnpm --dir web-app dev
```

Open [http://localhost:5173](http://localhost:5173). The Vite Cloudflare plugin runs the server in the Workers development runtime. Installation generates Worker binding types through the web app's `postinstall` script.

There is no fully configured offline bootstrap or seed command. UI scenarios supply fixture data for individual screens, but the shared app shell still includes authentication providers; do not assume scenarios remove every service dependency.

## Everyday commands

| Command (from root) | Purpose |
| --- | --- |
| `pnpm --dir web-app dev` | Run the web app with hot reload |
| `pnpm lint` | Run Oxlint across the repository |
| `pnpm typecheck` | Run workspace typecheck tasks through Turbo; currently only the web app defines one |
| `pnpm --dir web-app test` | Run web app unit/handler tests |
| `pnpm --dir web-app exec tsx --test tests/eventParticipantLimits.test.mjs` | Run one web app test file |
| `pnpm --dir web-app build` | Extract/compile translations and build the app, without applying migrations |
| `pnpm lingui` | Extract and compile translation catalogs |
| `pnpm --dir web-app cf-typegen` | Regenerate web app Cloudflare binding types after config changes |

`pnpm test` runs both workspace test suites through Turbo. **The existing cron suite includes tests that create, migrate, and write temporary SQLite files.** It is not an entirely in-memory suite. Under the repository's database-write approval rule, do not run it (or `pnpm --dir cron test`) without explicit approval. Pure logic and handler tests with fakes are the starting point for work that does not need database access.

The [GitHub Actions workflow](.github/workflows/test.yaml), despite being named “Test,” currently installs dependencies and runs the web app typecheck. Run the relevant tests and lint locally as well; CI does not run them for you.

## Making changes

Read [AGENTS.md](AGENTS.md) before contributing. Favor explicit code that is easy to understand and debug, and keep changes tied to a clear user benefit.

### Finding the right place

Start with the route in `web-app/src/routes/`, then follow its page/component and server-function imports. The `~/` import alias points to `web-app/src/`. `src/routeTree.gen.ts` is generated by the router tooling; edit route files instead.

For server behavior, keep validation and authentication at the server boundary and enforce permissions on the server. Existing functions such as [getEvents.ts](web-app/src/server-functions/getEvents.ts) delegate to a separately testable [handler](web-app/src/server-functions/getEventsHandler.ts) with an injected database dependency. Follow that pattern when it makes business logic easier to test without live services.

The cron worker imports the web app's database client and schema directly, so schema or event-lifecycle changes can affect both packages. [specs.md](web-app/specs.md) provides broader product context, but contains aspirational and outdated details; use the implementation and current configuration as the source of truth.

### UI changes and scenarios

For every new user-visible UI feature, add or update a route scenario that renders the feature, render it locally, and include a newly captured screenshot with your contribution. Existing development-only examples are:

- [Venues](http://localhost:5173/scenarios/venues): `web-app/src/routes/scenarios.venues.tsx`
- [Onboarding](http://localhost:5173/scenarios/onboarding): `web-app/src/routes/scenarios.onboarding.tsx`
- [Sport preferences](http://localhost:5173/scenarios/profile-sports-preferences): `web-app/src/routes/scenarios.profile-sports-preferences.tsx`
- [Participant capacity](http://localhost:5173/scenarios/participant-capacity): `web-app/src/routes/scenarios.participant-capacity.tsx`

Follow their fixture-data and callback patterns, and keep the development-only guard. Existing screenshot artifacts are in `web-app/artifacts/screenshots/`.

### Translations

Use Lingui macros for user-facing text, following nearby components. After changing text:

```sh
pnpm --dir web-app lingui:extract
# Review and translate entries in web-app/app/locales/en.po and cs.po.
pnpm --dir web-app lingui:compile
```

Review the catalog diff and generated messages before committing. Do not hand-edit compiled messages.

The Husky pre-commit hook launches `scripts/translate-missing.ts` in the background using Bun. When Czech translations are missing, it invokes the Claude CLI with permission prompts disabled, then attempts to stage all changes and create an additional commit. Bun and Claude are dependencies of that automation, not of the normal app runtime. For a manual translation/commit workflow, disable the hook for that commit with `HUSKY=0 git commit ...`, and run the relevant checks yourself.

### Database changes and tests

- Database writes require explicit user approval, including writes to local databases.
- Never run `db:migrate`. Migrations are applied by deployment or manually by a human; the app's actual migration script is named `migrate` and is subject to the same restriction.
- Edit `web-app/drizzle/schema.ts` (and `auth-schema.ts` for authentication tables), then use `pnpm --dir web-app generate` to generate migration files for review. Inspect the SQL and include the generated metadata with the change; generation does not apply the migration.
- Never add tests against a real database. The repository requires in-memory PGlite for database tests. PGlite is not currently installed, and the application schema is SQLite-specific, so using it requires a deliberate test setup rather than reusing the production client. Existing cron SQLite tests do not follow that requirement; do not copy their database setup for new tests.
- Prefer pure logic tests or injected fakes where they can verify the behavior meaningfully. Never point tests at production services.

### Pull requests

Target `main`. Explain the user-visible problem, the resulting behavior, and how you verified the change. Run `pnpm lint`, `pnpm typecheck`, and the relevant permitted tests; report any checks you could not run. Include new screenshots for UI features and review translation/migration artifacts when applicable. This project uses Oxlint, not ESLint; do not add `eslint-disable-line` comments.

## Scheduled worker and deployment

The [cron worker](cron/src/scheduled.ts) runs hourly (`0 * * * *`). It confirms or cancels events based on participation and deadlines, sends city/venue subscription emails, and processes comment digests.

For approved development work on the worker, create an ignored `cron/.dev.vars` with development values for `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `RESEND_API_KEY`, `SENDER_EMAIL`, and `APP_BASE_URL` (normally `http://localhost:5173`). `pnpm --dir cron dev` starts Wrangler with `--test-scheduled`; its HTTP response explains how to invoke the scheduled handler. Invoking it writes to the configured database and sends email, so it requires explicit approval and development services.

Deployment targets Cloudflare Workers, configured separately in [web-app/wrangler.jsonc](web-app/wrangler.jsonc) and [cron/wrangler.jsonc](cron/wrangler.jsonc). Maintainers must configure Cloudflare access, production secrets, the database, and the R2 binding.

- `pnpm --dir web-app build` builds without migrating, but may update translation artifacts.
- `pnpm --dir web-app ci:build` builds **and applies database migrations**.
- `pnpm --dir web-app deploy` runs `ci:build` and then `wrangler deploy`; `wrdeploy` is an alias for this flow.
- `pnpm --dir cron deploy` deploys the scheduled worker separately.

Deployment migration tooling needs `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in its process environment (or `.dev.vars`); deployed Worker secrets alone do not configure the local Drizzle CLI. Treat migration/deployment scripts as maintainer operations, not local setup or routine verification commands.
