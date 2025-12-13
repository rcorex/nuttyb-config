# Collective NuttyB Configurator

NuttyB Raptor Configuration Generator for Beyond All Reason

- Code is deployed to https://bar-nuttyb-collective.github.io/configurator/

## Local development

### Prerequisites
- Install Bun.
- Clone this repository.
- Install dependencies.

```bash
bun install
```

### Run locally (live reload)

Use a Next web server with live reload for development.

```bash
bun dev
```

The app will be available at http://localhost:3000

### Sync Lua data

This repo can build `public/data/lua-bundle.json` from all `.lua` files in `NuttyB-Raptors/lua/` using a Node.js script in `scripts/sync/sync.ts`. To run the sync process, execute

```bash
bun sync
```

Sync script supports pulling latest Lua files from either a local path or a GitHub repository. For more details, see the script's command-line help:

```bash
bun sync --help
```

### Verify Lua bundle

To verify the generated Lua bundle, run the following command:

```bash
bun run bundle-test
```

### Deployment (GitHub Pages)

Deployment is automated using GitHub Actions. Pushes to the `main` branch will trigger a build and deploy the site to GitHub Pages. By default, it uses repository name to define base path for the web application. If you want to use a custom base path, you can set the `BASE_PATH` repository variable in your repository settings. Note that you should not include leading slash in the `BASE_PATH` value.
