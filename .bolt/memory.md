# Project memory

## Product intent & audience

- **CraftBridge**: existing project imported from GitHub.
- Backend uses Supabase (env vars already configured).

## Brand personality & voice

- Not yet inferred; no UI copy or brand guidelines reviewed.

## Visual design & UX direction

- Not yet inferred; no design files, components, or UI inspected this turn.

## Decisions, constraints & rationale

- Project is a **Lovable / TanStack Start** app using **Vite** as the bundler/dev server.
- Package manager is **bun** (`bun.lock`, `bunfig.toml` present). Do not use npm for installs — npm 10.9.8 fails to parse the bun-style lockfile (`Cannot read properties of null (reading 'edgesOut')`).
- Dependencies are **not auto-installed on import**; `node_modules` must exist before `vite` binary is available and the preview can start.
- `AGENTS.md` exists and warns against modifying managed files (e.g. lockfiles). Regenerate `bun.lock` with `bun install` rather than deleting or replacing it.
- Build (`bun run build`) passes cleanly once dependencies are installed; server bundle and static assets generate without errors.
- Stray `package-lock.json` created by npm should be removed to keep the project consistent with bun.

## Open questions & assumptions

- Exact product purpose and target audience for CraftBridge not yet reviewed.
- No `.bolt/prompt` has been provided; global instructions and explicit user knowledge are currently absent.
- UI/UX patterns, component library, styling approach, and design tokens not yet inspected.
- Whether the environment will persist `bun` across sessions or require reinstallation is unknown.