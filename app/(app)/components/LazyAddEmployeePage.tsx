'use client';

import React, { Suspense } from 'react';
import { PageLoadingSpinner } from '@/lib/components/LoadingSpinner';

// Lazy load the AddEmployeePage component
const AddEmployeePage = React.lazy(() => import('./AddEmployeePage'));

/**
 * Lazy-loaded wrapper for the AddEmployeePage component
 * Provides loading fallback while the add employee form loads
 */
export default function LazyAddEmployeePage() {
    return (
        <Suspense fallback={<PageLoadingSpinner message="Loading add employee form..." />}>
            <AddEmployeePage />
        </Suspense>
    );
}
