# UI screenshots

Screenshot capture is repository tooling. Run it from any terminal, CI job, or coding agent that can run Node.js and Chromium; a Codex browser tab or browser connector is not required. Execution still follows the permissions of the environment running the command.

From the repository root, install dependencies and the pinned Chromium build once:

```sh
pnpm install --frozen-lockfile
pnpm --dir web-app exec playwright install chromium
```

On a fresh Linux CI image, use `playwright install --with-deps chromium` to install system libraries as well. Browser installation may need network access and system package installation may need elevated privileges. This is a setup step, not part of each capture.

Capture event comment picture attachments at desktop and mobile sizes:

```sh
pnpm --dir web-app screenshots
# One viewport or feature only:
pnpm --dir web-app screenshots event-comment-images.spec.ts --project=desktop
```

Capture another fixture page without writing a spec:

```sh
pnpm --dir web-app screenshot /scenarios/onboarding
pnpm --dir web-app screenshot /scenarios/event-comment-images --project=mobile
```

The command starts and stops its own Vite server at `http://127.0.0.1:5174`. Stop any existing server on that port first; the runner deliberately does not reuse a server with unknown credentials or configuration. The page command accepts local route paths only. Database-backed pages need a scenario or explicit fixture responses before they can run offline.

PNG files are saved in `web-app/artifacts/screenshots/desktop/` and `web-app/artifacts/screenshots/mobile/`. Each successful run refreshes the files for the selected captures. Review the new images, attach them to the contribution, and commit them with the feature. These captures use explicit assertions and are not pixel-diff baseline tests. Older PNGs directly in `artifacts/screenshots/` predate this runner.

The HTML report includes screenshot attachments. Failed runs also retain a trace and a failure screenshot under ignored `playwright-report/` and `test-results/` directories:

```sh
pnpm --dir web-app exec playwright show-report
# Validate test discovery without starting a server or a browser:
pnpm --dir web-app screenshots --list
pnpm --dir web-app screenshot /scenarios/onboarding --list
```

## Adding a feature

1. Add or update a development-only `/scenarios/<feature>` route using the real page/components with realistic fixture data and local callbacks. Preserve the production layout and page shell.
2. Add `<feature>.spec.ts` here, importing `test` and `expect` from `./fixtures`. Navigate to the scenario and wait for `html[data-hydrated="true"]` before interacting with server-rendered controls.
3. Assert the visible state before `await capture('feature-state')`. Use explicit UI assertions after each interaction so a screenshot cannot silently capture the wrong state.
4. Run the command and inspect both viewport images. Do not present a discovery-only check as a completed capture.

The shared fixture sets Czech locale, UTC timezone, fixed time, reduced motion, and a fresh browser context. It mocks the shell's anonymous auth session, rejects browser requests to live services and server functions, waits for hydration/fonts/images, and fails on browser exceptions. Add service stubs explicitly in a spec when needed; do not enable live upload or database access for screenshots.

## Isolation and CI

`serve.mjs` uses the `screenshots` Vite mode and the separate `screenshots/wrangler.jsonc`. Only dummy credentials are configured. The database URL points at an unavailable loopback port, there are no R2 bindings, remote bindings and persistence are disabled, and no migration or database seed runs. The runner does not read or rewrite the app's `.dev.vars`. It also disables dotenv/process-environment binding imports and refuses `.dev.vars`/`.env` overrides in this directory.

After normal dependency setup, CI can run the same commands and upload these directories as artifacts:

```sh
pnpm --dir web-app exec playwright install --with-deps chromium
pnpm --dir web-app screenshots
```

- `web-app/artifacts/screenshots/` — newly captured PNGs
- `web-app/playwright-report/` — HTML report
- `web-app/test-results/` — failure screenshots and traces

No hosted browser service, service credentials, display server, or interactive browser permission dialog is part of this workflow.

References: [Playwright web server configuration](https://playwright.dev/docs/test-webserver), [screenshots](https://playwright.dev/docs/screenshots), and [Cloudflare local environment variables](https://developers.cloudflare.com/workers/local-development/environment-variables/).
