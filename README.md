# Collective NuttyB Configurator

NuttyB Raptor Configuration Generator for Beyond All Reason

- Code is deployed to https://bar-nuttyb-collective.github.io/configurator/

- tweakdata.txt is used for tweaks

## Prerequisites
node/bun

or with mise-en-place: <https://mise.jdx.dev>

```bash
mise install
```

## Run locally (live reload)

Use a simple static server with live reload for development.

```bash
npx live-server
# or
bunx live-server
```

- Open in the browser:
  - Or open a specific page like http://localhost:8080/index.html or http://localhost:8080/encoder-hp.html

- Notes:
  - Adds live reload automatically when files in the repository root change.
  - If you do not want the browser to auto-open, add `--no-browser`.
  - If port 8080 is in use, change it with `--port <otherPort>`.

## Sync

This repo can build `tweakdata.txt` from all `.lua` files in `NuttyB/lua/` using a node script in `scripts/sync.js`.

### Quick start

- Dry-run (show what would change):

```bash
bun run ./scripts/sync.js --dry-run
```

- Perform sync (reads all `lua/**/*.lua` from the `main` branch, minifies and base64url-encodes, writes `tweakdata.txt`):

```bash
bun run ./scripts/sync.js
```

- Use a local NuttyB checkout instead of GitHub:

```bash
bun run ./scripts/sync.js --local-path ../NuttyB
```

- Choose a different branch:

```bash
bun run ./scripts/sync.js --branch dev
```
  
- Choose a different fork or repo:

```bash
bun run ./scripts/sync.js --owner myfork --repo my-raptors
```

### Script options

```bash
bun run scripts/sync.js [--dry-run] [--owner <name>] [--repo <name>] [--branch <name>] [--local-path <path>]
```

- `--dry-run`: Show actions without writing files.
- `--owner <name>`: Repository owner (default `BAR-NuttyB-collective`).
- `--repo <name>`: Repository name (default `NuttyB`).
- `--branch <name>`: Branch to pull from (default `main`).
- `--local-path <path>`: Use a local NuttyB repository checkout. Expects a `lua/` directory inside `<path>`. When set, `--owner`, `--repo`, and `--branch` are ignored.
