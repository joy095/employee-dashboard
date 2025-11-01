'use client';

import React, { Suspense } from 'react';
import { PageLoadingSpinner } from '@/lib/components/LoadingSpinner';

// Lazy load the EmployeeDetailPage component
const EmployeeDetailPage = React.lazy(() => import('./EmployeeDetailPage'));

interface Props {
    params: Promise<{ id: string }>;
}

/**
 * Lazy-loaded wrapper for the EmployeeDetailPage component
 * Provides loading fallback while the employee details page loads
 */
export default function LazyEmployeeDetailPage({ params }: Props) {
    return (
        <Suspense fallback={<PageLoadingSpinner message="Loading employee details..." />}>
            <EmployeeDetailPage params={params} />
        </Suspense>
    );
}
