#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
let luafmt;
try {
  luafmt = require('lua-format');
} catch (e) {
  // lua-format not installed, will use fallback
}

const DEFAULT_OWNER = 'BAR-NuttyB-collective';
const DEFAULT_REPO = 'NuttyB-Raptors';

function log(msg) {
  process.stdout.write(`${msg}\n`);
}

function err(msg) {
  process.stderr.write(`${msg}\n`);
}

function getCliArgs() {
  const args = process.argv.slice(2);
  const opts = { owner: DEFAULT_OWNER, repo: DEFAULT_REPO, branch: 'main', dryRun: false };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--dry-run') opts.dryRun = true;
    else if (a === '--owner') { opts.owner = args[i + 1]; i++; }
    else if (a === '--repo') { opts.repo = args[i + 1]; i++; }
    else if (a === '--branch') { opts.branch = args[i + 1]; i++; }
    else if (a === '--local-path') { opts.localPath = args[i + 1]; i++; }
    else if (a === '-h' || a === '--help') { opts.help = true; }
  }
  return opts;
}

function help() {
  log(`Usage: node scripts/sync.js [options]\n\n` +
      `Options:\n` +
      `  --dry-run              Print what would change, do not write files\n` +
      `  --owner <name>       Repository owner (default: ${DEFAULT_OWNER})\n` +
      `  --repo <name>        Repository name (default: ${DEFAULT_REPO})\n` +
      `  --branch <name>      Source branch (default: main)\n` +
      `  --local-path <path>  Read from local NuttyB-Raptors checkout (overrides owner/repo/branch)\n` +
      `  -h, --help            Show this help`);
}

function base64UrlEncode(buf) {
  const b64 = Buffer.isBuffer(buf) ? buf.toString('base64') : Buffer.from(buf).toString('base64');
  return b64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function fetchRaw(repoOwner, repoName, branch, filePath, token) {
  const encodedPath = filePath.split('/').map(encodeURIComponent).join('/');
  const url = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/${encodeURIComponent(branch)}/${encodedPath}`;
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, (res) => {
      if (res.statusCode !== 200) {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => reject(new Error(`HTTP ${res.statusCode} for ${url}: ${data.slice(0, 200)}`)));
        return;
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

function fetchGitTree(repoOwner, repoName, branch, token) {
  const url = `https://api.github.com/repos/${repoOwner}/${repoName}/git/trees/${encodeURIComponent(branch)}?recursive=1`;
  const headers = { 'User-Agent': 'nuttyb-config-sync-script' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode} for ${url}: ${data.slice(0,200)}`));
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function extractTopComments(content) {
  const lines = content.split('\n');
  let out = '';
  for (let i = 0; i < Math.min(3, lines.length); i++) {
    if (/^\s*--.*/.test(lines[i])) out += lines[i] + '\n'; else break;
  }
  return out;
}

function minifyLua(lua) {
  // Extract top comments first (first 3 lines starting with --).
  const topComments = extractTopComments(lua);

  // Remove comments from input before minifying to avoid luafmt header inclusion.
  let contentWithoutComments = lua;
  // Remove multi-line block comments: --[[ ... --]].
  contentWithoutComments = contentWithoutComments.replace(/--\[\[[\s\S]*?--\]\]/g, '');
  // Remove single-line comments entirely.
  contentWithoutComments = contentWithoutComments
    .split('\n')
    .filter((line) => !/^\s*--.*/.test(line))
    .join('\n')
    .trim();

  let minifiedCode = contentWithoutComments;
  if (luafmt) {
    try {
      minifiedCode = luafmt.Minify(contentWithoutComments, {
        RenameVariables: true,
        RenameGlobals: false,
        SolveMath: true,
      });
    } catch (e) {
      err(`lua-format minification failed: ${e.message}, using unminified content`);
      minifiedCode = contentWithoutComments;
    }
  }

  // Remove lua-format's own header block if any and trim.
  minifiedCode = minifiedCode.replace(/--\[\[[\s\S]*?--\]\]/g, '').trim();

  // Strip a leading 'return' if present (converter.ts strips it before encoding).
  minifiedCode = minifiedCode.replace(/^return\s*/, '');

  // Compose final output: top comments + processed code.
  return topComments + minifiedCode;
}

function computeTweakKey(luaPath) {
  // lua/<rootFiles>.lua => key is base name
  // lua/<dir>/<file>.lua => key is <dir>
  const parts = luaPath.split('/');
  if (parts.length === 2) {
    const base = parts[1].replace(/\.lua$/, '');
    return base;
  }
  return parts[1];
}

function parseExistingTweakdata(filePath) {
  const items = [];
  try {
    if (!fs.existsSync(filePath)) return items;
    const raw = fs.readFileSync(filePath, 'utf8');
    const lines = raw.split(/\r?\n/);
    for (const line of lines) {
      if (!line.trim()) continue;
      const m = line.match(/^(.+?)\t!bset\s+(\S+)\s+(\S+)/);
      if (!m) continue;
      const label = m[1];
      const key = m[2];
      items.push({ label, key });
    }
  } catch (e) {
    err(`Failed to parse tweakdata.txt: ${e.message}`);
  }
  return items;
}

async function main() {
  const opts = getCliArgs();
  if (opts.help) { help(); process.exit(0); }

  const token = process.env.GITHUB_TOKEN || '';

  let luaFiles = [];
  let useLocal = false;
  let localRoot = '';
  if (opts.localPath) {
    useLocal = true;
    localRoot = path.resolve(process.cwd(), opts.localPath);
    const luaRoot = path.join(localRoot, 'lua');
    if (!fs.existsSync(luaRoot) || !fs.statSync(luaRoot).isDirectory()) {
      err(`Local path does not contain lua directory: ${luaRoot}`);
      process.exit(1);
    }
    const stack = [''];
    while (stack.length) {
      const rel = stack.pop();
      const abs = path.join(luaRoot, rel);
      const entries = fs.readdirSync(abs, { withFileTypes: true });
      for (const ent of entries) {
        if (ent.isDirectory()) {
          stack.push(path.join(rel, ent.name));
        } else if (ent.isFile() && ent.name.endsWith('.lua')) {
          const relPath = path.join('lua', rel, ent.name).replace(/\\/g, '/');
          luaFiles.push(relPath);
        }
      }
    }
    log(`Listing lua files from local path ${localRoot} ...`);
  } else {
    log(`Listing lua files from ${opts.owner}/${opts.repo}@${opts.branch} ...`);
    const tree = await fetchGitTree(opts.owner, opts.repo, opts.branch, token);
    luaFiles = (tree.tree || [])
      .filter((t) => t.type === 'blob' && t.path.startsWith('lua/') && t.path.endsWith('.lua'))
      .map((t) => t.path);
  }

  log(`Found ${luaFiles.length} lua files.`);

  const tweaks = [];
  let orderIndex = 0;
  for (const pth of luaFiles) {
    try {
      let content;
      if (useLocal) {
        const full = path.join(localRoot, pth);
        content = fs.readFileSync(full, 'utf8');
      } else {
        const buf = await fetchRaw(opts.owner, opts.repo, opts.branch, pth, token);
        content = buf.toString('utf8');
      }
      const header = extractTopComments(content);
      const transformed = minifyLua(content);
      const tweakValue = base64UrlEncode(transformed);
      const tweakKey = computeTweakKey(pth);
      const title = (header.split('\n')[0] || '').trim();
      tweaks.push({ tweakKey, tweakValue, newSize: tweakValue.length, order: orderIndex++, title });
    } catch (e) {
      err(`Failed to process ${pth}: ${e.message}`);
    }
  }

  // Keep the largest value per key
  const largestByKey = new Map();
  for (const t of tweaks) {
    const prev = largestByKey.get(t.tweakKey);
    if (!prev || t.newSize > prev.newSize) largestByKey.set(t.tweakKey, t);
  }
  // Reproduce existing tweakdata.txt labels and order, replacing only the base64 values.
  const targetPath = path.resolve(process.cwd(), 'tweakdata.txt');
  const desired = parseExistingTweakdata(targetPath);
  if (!desired.length) {
    err('No entries parsed from tweakdata.txt; refusing to overwrite with unlabeled output.');
    process.exit(1);
  }
  const lines = [];
  for (const { label, key } of desired) {
    const found = largestByKey.get(key);
    if (!found) {
      err(`Warning: no new content found for key '${key}'. Keeping existing line unchanged.`);
      // Read the original line to preserve exact spacing/value
      try {
        const raw = fs.readFileSync(targetPath, 'utf8');
        const m = raw.match(new RegExp(`^${label.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\t!bset\\s+${key}\\s+.*$`, 'm'));
        if (m) { lines.push(m[0]); continue; }
      } catch (_) { /* ignore */ }
      // Fallback to emitting empty value to avoid data loss
      lines.push(`${label}\t!bset ${key} `);
      continue;
    }
    lines.push(`${label}\t!bset ${key} ${found.tweakValue}`);
  }
  const out = lines.join('\n') + (lines.length ? '\n' : '');

  if (opts.dryRun) {
    log('--- Summary ---');
    log(`Would write tweakdata.txt with ${lines.length} lines.`);
    log(lines.slice(0, 5).map((l) => `  ${l}`).join('\n') + (lines.length > 5 ? `\n  ... (${lines.length - 5} more)` : ''));
  } else {
    fs.writeFileSync(targetPath, out, 'utf8');
    log(`Wrote tweakdata.txt with ${lines.length} lines.`);
  }
}

main().catch((e) => {
  err(e.stack || e.message);
  process.exit(1);
});
