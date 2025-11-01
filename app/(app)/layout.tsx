'use client';

import Providers from '../providers'; // Adjust path as needed
import { ReactNode } from 'react';

export default function ClientLayout({
    children,
}: {
    children: ReactNode;
}) {
    // This layout provides the Apollo context to all pages inside the (app) group
    return (
        <Providers>
            {children}
        </Providers>
    );
}