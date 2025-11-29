// Locally stored data
import type { LuaFile } from '@/types/types';
export type { LuaFile } from '@/types/types';

export interface Bundle {
    sha: string;
    files: LuaFile[];
}

// Github types
export interface GitHubCommit {
    sha: string;
    node_id: string;
    commit: {
        author: {
            name: string;
            email: string;
            date: string;
        };
        committer: {
            name: string;
            email: string;
            date: string;
        };
        message: string;
    };
}

export interface GitHubTreeItem {
    path: string;
    mode: string;
    type: string;
    sha: string;
    size?: number;
    url: string;
}

export interface GitHubTreeResponse {
    sha: string;
    url: string;
    tree: GitHubTreeItem[];
    truncated: boolean;
}
