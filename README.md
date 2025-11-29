# Collective NuttyB Configurator

NuttyB Raptor Configuration Generator for Beyond All Reason

- Code is deployed to https://bar-nuttyb-collective.github.io/configurator/

## Run locally (live reload)

Use a simple static server with live reload for development.

```bash
bun dev
```

The app will be available at http://localhost:3000

## Sync

This repo can build `public/data/lua-bundle.json` from all `.lua` files in `NuttyB-Raptors/lua/` using a Node.js script in `scripts/sync.ts`. To run the sync process, execute

```bash
bun sync
```

### Prerequisites
- Bun

### How it works

- Reads all `.lua` files under `lua/` from the NuttyB collective repo.
- Minifies Lua source code.
- Encodes result with Base64URL.

The app consolidates similar tweaks (tweakunits/tweakdefs) to save up tweak slots.
