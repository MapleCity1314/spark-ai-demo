# Repository Guidelines

## Project Structure & Module Organization
- Monorepo managed by Turborepo and pnpm. Workspace roots: `apps/*` and `packages/*`.
- `apps/web`: Next.js 16 app (React 19, Tailwind CSS). UI code lives under `apps/web` (e.g., `app/`, `components/`).
- `apps/server`: Python FastAPI service (Spoon AI SDK). Entry point: `apps/server/spoonos_server`.
- `packages/eslint-config` and `packages/typescript-config`: shared linting and TS configs.

## Build, Test, and Development Commands
- `pnpm install`: install workspace dependencies.
- `pnpm dev`: run all app dev servers via Turbo.
- `pnpm build`: build all apps/packages via Turbo.
- `pnpm lint`: run linting across the workspace.
- `pnpm format`: format `ts/tsx/md` files with Prettier.
- `pnpm check-types`: run TypeScript type checks.
- Python server (from `apps/server`):
  - `uvicorn spoonos_server.server.app:app --reload`: run API locally.
  - `pytest`: run server tests.

## Coding Style & Naming Conventions
- TypeScript/React: format with Prettier; lint with ESLint (`pnpm lint`).
- Use 2-space indentation for TS/TSX (Prettier default).
- Next.js/React components must be split into focused, reusable pieces; avoid large all-in-one files.
- Component filenames must use kebab-case: `aaa-bbb-ccc.tsx`.
- Keep React hooks in `useCamelCase` (e.g., `useAgent.ts`).
- Python: follow PEP 8 naming (snake_case for modules/functions, PascalCase for classes).

## Testing Guidelines
- Python tests use `pytest` (see `apps/server/spoonos_server/**/test_*.py`).
- No JS test runner is configured; prefer adding tests near the app they cover.
- Name tests with `test_*.py` and keep fixtures close to the module under test.

## Commit & Pull Request Guidelines
- No established commit convention (only initial commit). Use short, imperative messages (e.g., "Add server health check").
- PRs should include: summary, scope, and any required environment changes.
- Include screenshots/gifs for UI changes in `apps/web`.

## Configuration & Secrets
- Server expects `.env` in `apps/server` or repo root with `OPENROUTER_API_KEY`.
- Node >= 18 and pnpm 9 are required (see `package.json`).
