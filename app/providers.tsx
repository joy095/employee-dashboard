'use client';

import { ApolloProvider } from '@apollo/client/react';
import client from '../lib/apollo-client'; // Adjust path as needed
import { ReactNode } from 'react';

/**
 * Providers component that wraps the application with Apollo Client
 * This component provides GraphQL functionality to all child components
 * 
 * Features:
 * - Apollo Client integration for GraphQL queries and mutations
 * - Optimized caching and error handling
 * - Performance optimizations through connection pooling
 * 
 * @param children - React children components to wrap with Apollo Provider
 * @returns JSX element with Apollo Provider context
 */
export default function Providers({ children }: { children: ReactNode }) {
    return (
        <ApolloProvider client={client}>
            {children}
        </ApolloProvider>
    );
}