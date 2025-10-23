# Collective NuttyB Configurator

NuttyB Raptor Configuration Generator for Beyond All Reason

- Code is deployed to https://bar-nuttyb-collective.github.io/configurator/

- tweakdata.txt is used for tweaks
- modes.txt is used for base tweaks, maps and modes
- links.md is shown in the Links section

## Sync

This repo can build `tweakdata.txt` from all `.lua` files in `NuttyB-Raptors/lua/` using a Node.js script in `scripts/sync.js`.

### Prerequisites
- Node.js 16+.
- Optional: `GITHUB_TOKEN` env var to avoid API rate limits when fetching from GitHub raw.

### Quick start

- Dry-run (show what would change):

```bash
node scripts/sync.js --dry-run
```

- Perform sync (reads all `lua/**/*.lua` from the `main` branch, minifies and base64url-encodes, writes `tweakdata.txt`):

```bash
node scripts/sync.js
```

- Choose a different branch:

```bash
node scripts/sync.js --branch dev

- Choose a different fork or repo:

```bash
node scripts/sync.js --owner myfork --repo my-raptors
```
```

### Script options

```bash
node scripts/sync.js [--dry-run] [--owner <name>] [--repo <name>] [--branch <name>]
```

- `--dry-run`: Show actions without writing files.
- `--owner <name>`: Repository owner (default `BAR-NuttyB-collective`).
- `--repo <name>`: Repository name (default `NuttyB-Raptors`).
- `--branch <name>`: Branch to pull from (default `main`).

### How it works

- Reads all `.lua` files under `lua/` from the target repo and branch.
- Preserves up to three top comment lines per file.
- Minifies with `npx luamin` when available (falls back to a simple minifier otherwise).
- For files under `lua/units/`, trims the output to start from the first `{` like the upstream converter.
- Encodes result with Base64URL.
- Groups by tweak key: directory name for nested files, or base name for root-level files.
- Writes one line per key to `tweakdata.txt` as `!bset <key> <value>`.
