# Fio banka payments

Users connect a Czech Fio account in CZK **once in their profile**. The encrypted token belongs to the user, and every event they organize can reuse that connection. Event forms only select manual or Fio tracking; they never ask for an API token. A connected profile hides the token form until the user explicitly chooses to replace it.

In Fio Internetbanking → Nastavení → API, create a token with **Sledování účtu** (read-only) permission. Newly authorized tokens take five minutes to activate. The export API does not report a token's permissions, so the UI requires users to acknowledge that they selected read-only access. The integration only calls the GET transaction export endpoint and never submits transfers.

## Deployment

1. Configure the same `FIO_TOKEN_ENCRYPTION_KEY` secret on both `hraj-eu` and `hraj-eu-cron`. Generate a random 32-byte key encoded as 64 hexadecimal characters, for example with `openssl rand -hex 32`. Store it through your normal Cloudflare secret management; never commit it. Local development uses `.dev.vars`.
2. Apply the generated `drizzle/migrations/0019_fio_payments.sql` through the existing deployment migration process or have a human apply it. This feature does not run migrations itself.
3. Deploy the web app and cron worker. Cron retains the existing hourly work and adds checks at minutes 5, 10, …, 55, with the hourly invocation also checking payments.
4. Connect a read-only token and verify a small incoming test payment in your own authorized environment. Automated tests use in-memory PGlite and mock Fio responses; they do not connect to a bank or deployment database.

Do not change the encryption key without first re-encrypting saved tokens with the old key. Disconnecting clears the encrypted token and pauses checks. Replacing a token resumes checks for the same account; an account already used by events cannot be switched to a different IBAN because existing QR codes still point at it.

## Event behavior

- Manual tracking remains the default. Organizers can confirm or clear players' payment status.
- Fio tracking assigns a distinct numeric variable symbol to every player and named guest. QR codes include the verified account, CZK, fixed amount and variable symbol. A player can view their own requests; the organizer can view every request for their event.
- The fixed per-player amount is the total event price divided by the ideal player count (or maximum), rounded once to cents. Once anyone registers, price, currency, tracking mode and payment requirement are locked. Capacity can still change without changing amounts already issued.
- With advance payment required, a booking holds capacity in `pending_payment` and does **not** count as confirmed attendance or toward the minimum for the cron confirmation decision. Full payment for the player and their guests confirms their booking. For manual tracking only the organizer can verify advance payments; players cannot self-confirm.
- Waitlisted players are not asked to pay. When a place opens, their booking becomes pending (or confirmed if advance payment is not required), and Fio payment requests are created in the same transaction.
- Guest lists are fixed after booking for these events. Additional players can join separately. Leaving cancels the whole booking and its active requests; a rejoin issues new references. Old references remain available to detect late payments for organizer review.
- Partial payments accumulate. Repeated bank exports cannot double-count a transaction. Overpayments and payments for cancelled bookings/events are visible for refund review. Refunds are handled by the organizer directly in their bank; hraj.eu does not issue refunds.
- Pending places remain held until the participant or organizer cancels them. There is no automatic reservation timeout.

## Reconciliation and data handling

Fio tokens use AES-256-GCM with a random nonce and user ID authenticated as additional data. They live in a separate server-only table, outside public profiles and auth session payloads. The application returns only safe status codes and never logs Fio URLs or responses.

The worker uses repeatable `/periods` exports rather than `/last`, which would advance Fio's cursor before our database transaction commits. A database lease prevents overlapping polls and enforces at least two minutes between requests from this app. Another app using the same token can still trigger Fio's rate limit; use a dedicated token.

Exports overlap by two days and process at most seven days of history per request. The successful cursor advances only after receipts and attendance updates commit. The automatic lookback is limited to 89 days because older Fio history requires extra authorization. An outage exceeding this limit requires manual review of older payments.

Only incoming credits with a matching variable symbol, expected currency and a booking date on or after request creation are counted. A transaction can be used only once per bank account. Amounts are stored as integer cents. Only matching payment amounts, transaction IDs and booking dates are retained; account balances and unrelated transactions are discarded. Bank processing delays and invalid/expired tokens are shown in the app.

## Preview and checks

The development-only `/scenarios/fio-payments` route shows event payment settings, a player's QR payment, and the organizer's payment table. Its controls simulate receipt and cancellation in browser state. Profile setup has its own `/scenarios/fio-profile` route, including replacing or disconnecting a saved token. No event page or event preview renders the token input.

Run `pnpm --dir web-app screenshots` from the repository root to capture these states at desktop and mobile sizes. The [portable Playwright runner](screenshots/README.md) uses isolated fixture configuration and requires no bank, database, or agent browser connection. It checks that event screens never show a token input and that the profile reveals the input only for setup or explicit replacement.

Run the relevant suite from `web-app`:

```sh
node --import tsx --test --test-isolation=none tests/fio.test.mjs tests/leaveEventHandler.test.mjs tests/qrCodeGenerator.test.mjs tests/participantUpdates.test.mjs tests/waitlistPromotion.test.mjs tests/eventParticipantLimits.test.mjs tests/mentionableParticipants.test.mjs
```

The test adapter runs the production Drizzle query builders against ephemeral PGlite. It translates placeholders and auto-increment defaults for PostgreSQL, so it validates reconciliation, transaction rollback and constraints without claiming to test a live Turso deployment or applying SQLite migrations.

References: [Fio API specification](https://www.fio.cz/docs/cz/API_Bankovnictvi.pdf), [QR Platba format](https://qr-platba.cz/pro-vyvojare/specifikace-formatu/).
