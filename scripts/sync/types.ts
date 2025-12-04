// Locally stored data
import type { LuaFile } from '@/types/types';
export type { LuaFile } from '@/types/types';

export interface Bundle {
    sha: string;
    files: LuaFile[];
}
