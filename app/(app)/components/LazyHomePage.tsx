'use client';

import React, { Suspense } from 'react';
import { PageLoadingSpinner } from '@/lib/components/LoadingSpinner';

// Lazy load the main HomePage component
const HomePage = React.lazy(() => import('./HomePage'));

/**
 * Lazy-loaded wrapper for the HomePage component
 * Provides loading fallback while the main page component loads
 */
export default function LazyHomePage() {
    return (
        <Suspense fallback={<PageLoadingSpinner message="Loading employee directory..." />}>
            <HomePage />
        </Suspense>
    );
}
