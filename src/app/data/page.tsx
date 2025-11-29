'use client';

import { useMemo } from 'react';

import { Code, Group, Stack, Table, Text, Title } from '@mantine/core';

import { useLuaBundleContext } from '@/components/contexts/lua-bundle-context';
import PageLoader from '@/components/page-loader';
import DataPreview from '@/components/tabs/data/data-preview';
import FileList from '@/components/tabs/data/file-list';
import TypeBadge from '@/components/tabs/data/type-badge';
import { encode } from '@/lib/base64';
import { CONFIGURATION_MAPPING } from '@/lib/data/configuration-mapping';
import { LuaFile, TweakType } from '@/types/types';

interface ConfigValueEntry {
    value: string;
    data: string[];
    luaFilePaths?: string[];
    missingFiles?: string[];
}

interface ConfigOptionEntry {
    configKey: string;
    description: string;
    type: TweakType;
    values: ConfigValueEntry[];
}

function buildConfigurationView(luaFiles: LuaFile[]): ConfigOptionEntry[] {
    const luaFileMap = new Map(luaFiles.map((f) => [f.path, f.data]));
    const entries: ConfigOptionEntry[] = [];

    for (const [configKey, mapping] of Object.entries(CONFIGURATION_MAPPING)) {
        const valueEntries: ConfigValueEntry[] = [];

        for (const [valueKey, paths] of Object.entries(mapping.values)) {
            if (!paths) {
                valueEntries.push({ value: valueKey, data: [] });
                continue;
            }

            const isLuaFile = mapping.type !== 'command';

            if (isLuaFile) {
                const encodedData: string[] = [];
                const luaFilePaths: string[] = [];
                const missingFiles: string[] = [];

                for (const path of paths) {
                    const cleanPath = path.replace(/^~/, '');
                    const content = luaFileMap.get(cleanPath);
                    luaFilePaths.push(cleanPath);

                    if (content) {
                        encodedData.push(encode(content.trim()));
                    } else {
                        missingFiles.push(cleanPath);
                    }
                }

                valueEntries.push({
                    value: valueKey,
                    data: encodedData,
                    luaFilePaths,
                    missingFiles:
                        missingFiles.length > 0 ? missingFiles : undefined,
                });
            } else {
                valueEntries.push({ value: valueKey, data: paths });
            }
        }

        entries.push({
            configKey,
            description: mapping.description,
            type: mapping.type,
            values: valueEntries,
        });
    }

    return entries;
}

export default function Page() {
    const { luaFiles, sha, isLoading, error } = useLuaBundleContext();

    const configEntries = useMemo(
        () => buildConfigurationView(luaFiles),
        [luaFiles]
    );

    const groupedByType = useMemo(() => {
        const groups: Record<TweakType, ConfigOptionEntry[]> = {
            command: [],
            tweakdefs: [],
            tweakunits: [],
        };

        for (const entry of configEntries) {
            groups[entry.type].push(entry);
        }

        return groups;
    }, [configEntries]);

    if (isLoading) return <PageLoader />;
    if (error) return <div>Error: {error.message}</div>;

    return (
        <Stack gap='xl'>
            <Group justify='space-between'>
                <Title order={2}>Configuration Data Reference</Title>
                {sha && (
                    <Text size='sm' c='dimmed'>
                        Bundle: <Code>{sha.slice(0, 7)}</Code>
                    </Text>
                )}
            </Group>

            <Text size='sm' c='dimmed'>
                All configuration options with underlying data.
                {luaFiles.length > 0 && ` ${luaFiles.length} Lua files loaded.`}
            </Text>

            {/* Commands Section */}
            {groupedByType.command.length > 0 && (
                <Stack gap='md'>
                    <Group gap='xs'>
                        <Title order={3}>Commands</Title>
                        <TypeBadge type='command' />
                    </Group>

                    {groupedByType.command.map((option) => (
                        <Stack key={option.configKey} gap='xs'>
                            <Text fw={500}>{option.description}</Text>
                            <Table striped highlightOnHover withTableBorder>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th style={{ width: '150px' }}>
                                            Value
                                        </Table.Th>
                                        <Table.Th>Commands</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {option.values.map((v) => (
                                        <Table.Tr key={v.value}>
                                            <Table.Td>
                                                <Code>{v.value}</Code>
                                            </Table.Td>
                                            <Table.Td>
                                                <DataPreview data={v.data} />
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        </Stack>
                    ))}
                </Stack>
            )}

            {/* Tweakdefs Section */}
            {groupedByType.tweakdefs.length > 0 && (
                <Stack gap='md'>
                    <Group gap='xs'>
                        <Title order={3}>Tweakdefs</Title>
                        <TypeBadge type='tweakdefs' />
                    </Group>

                    {groupedByType.tweakdefs.map((option) => (
                        <Stack key={option.configKey} gap='xs'>
                            <Text fw={500}>{option.description}</Text>
                            <Table striped highlightOnHover withTableBorder>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th style={{ width: '100px' }}>
                                            Value
                                        </Table.Th>
                                        <Table.Th style={{ width: '180px' }}>
                                            File(s)
                                        </Table.Th>
                                        <Table.Th>Base64 Data</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {option.values.map((v) => (
                                        <Table.Tr key={v.value}>
                                            <Table.Td>
                                                <Code>{v.value}</Code>
                                            </Table.Td>
                                            <Table.Td>
                                                <FileList
                                                    paths={v.luaFilePaths}
                                                    missing={v.missingFiles}
                                                />
                                            </Table.Td>
                                            <Table.Td>
                                                <DataPreview data={v.data} />
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        </Stack>
                    ))}
                </Stack>
            )}

            {/* Tweakunits Section */}
            {groupedByType.tweakunits.length > 0 && (
                <Stack gap='md'>
                    <Group gap='xs'>
                        <Title order={3}>Tweakunits</Title>
                        <TypeBadge type='tweakunits' />
                    </Group>

                    {groupedByType.tweakunits.map((option) => (
                        <Stack key={option.configKey} gap='xs'>
                            <Text fw={500}>{option.description}</Text>
                            <Table striped highlightOnHover withTableBorder>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th style={{ width: '100px' }}>
                                            Value
                                        </Table.Th>
                                        <Table.Th style={{ width: '180px' }}>
                                            File(s)
                                        </Table.Th>
                                        <Table.Th>Base64 Data</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {option.values.map((v) => (
                                        <Table.Tr key={v.value}>
                                            <Table.Td>
                                                <Code>{v.value}</Code>
                                            </Table.Td>
                                            <Table.Td>
                                                <FileList
                                                    paths={v.luaFilePaths}
                                                    missing={v.missingFiles}
                                                />
                                            </Table.Td>
                                            <Table.Td>
                                                <DataPreview data={v.data} />
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        </Stack>
                    ))}
                </Stack>
            )}
        </Stack>
    );
}
