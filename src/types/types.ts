import type { Configuration } from '../lib/configuration';

// Extract all possible values from Configuration properties
export type ExtractValues<T> = T extends readonly (infer U)[]
    ? U
    : T extends object
      ? T[keyof T]
      : T;

// Convert boolean to string literals for Record compatibility
export type StringifyBooleans<T> = T extends boolean ? `${T}` : T;

export type TweakType = 'tweakdefs' | 'tweakunits' | 'command';

// Hierarchical mapping: parameter -> possible value -> mapped string
export type ValueMapping = {
    [K in keyof Configuration]: {
        values: Record<
            StringifyBooleans<ExtractValues<Configuration[K]>>,
            string[] | undefined
        >;
    } & { description: string; type: TweakType };
};

export interface LuaFile {
    path: string;
    data: string;
}
