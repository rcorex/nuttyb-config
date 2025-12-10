'use client';

import { useEffect } from 'react';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

import PageLoader from '@/components/page-loader';
import { LINKS } from '@/lib/navigation';

// Dynamically import configurator to avoid circular dependencies
const ConfiguratorPage = dynamic(() => import('./configurator/page'), {
    loading: () => <PageLoader />,
});

// Check at build time if we should render configurator at root
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

/**
 * Root page behavior:
 * - GitHub Pages (basePath='/configurator'): Render configurator directly here
 *   to avoid redirect to /configurator/configurator
 * - Development (no basePath): Redirect to /configurator
 */
export default function RootPage() {
    const router = useRouter();

    useEffect(() => {
        // Only redirect in development (when basePath is not set)
        if (basePath !== '/configurator') {
            router.replace(LINKS.configurator.href);
        }
    }, [router]);

    // When basePath is '/configurator', the URL /configurator/ IS our root
    // Render configurator here to avoid double-path navigation
    if (basePath === '/configurator') {
        return <ConfiguratorPage />;
    }

    // In development, show loader while redirecting to /configurator
    return <PageLoader />;
}
