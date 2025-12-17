# Repository Guidelines

## Project Structure & Module Organization

`index.js` bootstraps the WhatsApp listener and routes work into `src/`, which holds the runtime modules: `whatsapp.js` manages Baileys sessions, `processor.js` coordinates scraping/AI/database flows, and subfolders such as `scrapers/`, `ai/`, `database/`, and `utils/` encapsulate platform scraping, Ollama prompts, PostgreSQL helpers, and shared logging/URL utilities. Database schema files live under `sql/`, reusable automation scripts (environment fixes, DB/Ollama tests, stats) are in `scripts/`, and transient data such as `auth_info/` and `logs/` must stay uncommitted.

## Build, Test, and Development Commands

- `npm install` — install runtime dependencies; rerun after editing `package.json`.
- `npx playwright install chromium && npx playwright install-deps chromium` — provision the scraper browser locally when Playwright is upgraded.
- `npm start` — run the WhatsApp bridge end to end; the terminal QR must be rescanned after clearing `auth_info/`.
- `npm run test-db` / `npm run setup-db` — validate PostgreSQL connectivity and seed schema (`sql/schema.sql`).
- `npm run test-ollama` and `npm run test-scraper` — sanity-check the AI prompt and scraping stack before pushing.
- `npm run stats` — inspect stored analyses to verify recent changes did not break persistence.

## Coding Style & Naming Conventions

Use modern Node.js (>=18) features, CommonJS modules, and 4-space indentation. Favor descriptive camelCase for variables/functions (`processUrl`, `scrapeTwitter`) and kebab-case for script filenames. Keep logging structured via `src/utils/logger.js` and reuse `logger.info/error` to ensure consistent prefixes. Place secrets/config only in `.env` files derived from `.env.example`; never hardcode credentials inside source. When expanding prompts or SQL, document non-obvious constants with short inline comments.

## Testing Guidelines

There is no formal unit-test suite; rely on the provided scripts plus ad-hoc instrumentation. Name any new diagnostic script under `scripts/` as `test-*.js` to keep `npm run test-*` conventions predictable. Before submitting, run `npm run test-db`, `npm run test-ollama`, and a manual WhatsApp flow using `npm start` to confirm message ingestion, along with `npm run stats` to ensure DB writes appear. If you add Playwright-heavy changes, capture sample URLs in `scripts/test-scraper.js` for repeatable smoke tests.

## Commit & Pull Request Guidelines

Existing history uses short, Spanish, action-led subjects (e.g., “cambios Make”, “documentación actualizada”). Follow that tone: concise present-tense summaries under ~60 characters, optionally expanded in the body for motivation/risk. Every PR should include: (1) a clear description of the problem and solution, (2) explicit mention of scripts run (`npm run test-db`, etc.), (3) linked issue or context, and (4) screenshots/log excerpts for user-visible changes such as new prompts or stats output. Request review only after sanitizing `.env`, `auth_info/`, and `logs/`. For security fixes or configuration tweaks, highlight any `.env` additions to help other agents update their local setups promptly.
