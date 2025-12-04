import type { LuaFile } from '@/types/types';

import { fetchLua, getLatestCommitHash } from './connectors/github';
import {
    deleteData,
    getSavedBundle,
    saveBundle,
} from './connectors/target-store';
import { log } from './utils/logger';
import { minify } from './utils/minificator';

// Default GitHub repository to pull from
const REPO_OWNER = 'BAR-NuttyB-collective';
const REPO_NAME = 'NuttyB';
const REPO_BRANCH = 'main';

async function main() {
    log('Sync started');

    log('Reading cached data');
    const savedBundle = getSavedBundle();

    log('Reading commit hashes');
    const commitHashLocal = savedBundle ? savedBundle.sha : undefined;
    const commitHashRemote = await getLatestCommitHash(
        REPO_OWNER,
        REPO_NAME,
        REPO_BRANCH
    );

    if (!commitHashRemote) throw new Error('Failed to retrieve remote commit');

    if (commitHashLocal === commitHashRemote) {
        log('Commit hashes match. No action needed.');
        return;
    }

    log('Updating from remote');
    deleteData();

    log('Fetching Lua files from GitHub');
    const fileData = await fetchLua(REPO_OWNER, REPO_NAME, REPO_BRANCH);

    log('Generating Lua bundle');
    const bundle: { sha: string; files: LuaFile[] } = {
        sha: commitHashRemote,
        files: fileData.map((file) => ({
            path: file.path,
            data: minify(file.data),
        })),
    };
    saveBundle(bundle);

    log('Sync completed');
}

await main();
