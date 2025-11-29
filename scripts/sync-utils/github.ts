import { GitHubCommit, GitHubTreeResponse, LuaFile } from '../types';

const REPO_OWNER = 'BAR-NuttyB-collective';
const REPO_NAME = 'NuttyB';
const REPO_BRANCH = 'main';

export async function getLatestCommitHash(): Promise<string> {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits/${REPO_BRANCH}`;
    const headers = {
        'User-Agent': 'nuttyb-configurator',
        Accept: 'application/vnd.github.v3+json',
    };

    const response = await fetch(url, { headers });

    if (!response.ok) {
        throw new Error(
            `Failed to fetch commit hash: ${response.status} ${response.statusText}`
        );
    }

    const data = (await response.json()) as GitHubCommit;

    return data.sha;
}

async function fetchLuaFileTree(): Promise<string[]> {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/trees/${REPO_BRANCH}?recursive=1`;
    const headers = {
        'User-Agent': 'nuttyb-configurator',
        Accept: 'application/vnd.github.v3+json',
    };

    const response = await fetch(url, { headers });

    if (!response.ok) {
        throw new Error(
            `Failed to fetch file tree: ${response.status} ${response.statusText}`
        );
    }

    const data = (await response.json()) as GitHubTreeResponse;

    // Filter for lua/**/*.lua files
    const luaFiles = data.tree
        .filter(
            (item) =>
                item.type === 'blob' &&
                item.path.startsWith('lua/') &&
                item.path.endsWith('.lua')
        )
        .map((item) => item.path);

    return luaFiles;
}

async function fetchRawFile(filePath: string): Promise<string> {
    const url = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${REPO_BRANCH}/${filePath}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Failed to fetch ${filePath}: ${response.status} ${response.statusText}`
        );
    }

    return response.text();
}

export async function fetchLua(): Promise<LuaFile[]> {
    const luaPaths = await fetchLuaFileTree();
    const files: LuaFile[] = [];

    for (const path of luaPaths) {
        try {
            const data = await fetchRawFile(path);
            files.push({ path, data });
        } catch (error) {
            console.error(`Failed to process ${path}:`, error);
        }
    }

    return files;
}
