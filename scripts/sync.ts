import type { LuaFile } from '@/types/types';

import { fetchLua, getLatestCommitHash } from './sync-utils/github';
import { deleteData, getSavedBundle, saveBundle } from './sync-utils/local';
import { log } from './sync-utils/logger';
import { minify } from './sync-utils/minificator';

async function main() {
    log('Sync started');

    log('Reading cached data');
    const savedBundle = getSavedBundle();

    log('Reading commit hashes');
    const commitHashLocal = savedBundle ? savedBundle.sha : undefined;
    const commitHashRemote = await getLatestCommitHash();

    if (!commitHashRemote) throw new Error('Failed to retrieve remote commit');

    if (commitHashLocal === commitHashRemote) {
        log('Commit hashes match. No action needed.');
        return;
    }

    log('Updating from remote');
    deleteData();

    log('Fetching Lua files from GitHub');
    const fileData = await fetchLua();

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
