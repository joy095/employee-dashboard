import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

/**
 * Optimized Apollo Client configuration
 * Features: InMemoryCache with type policies, error handling, performance optimizations
 */

// HTTP link configuration for GraphQL endpoint
const httpLink = new HttpLink({
    uri: '/api/graphql',
});

// Context link for adding headers (extensible for authentication)
const authLink = setContext((_, { headers }) => {
    return {
        headers: {
            ...headers,
            'Content-Type': 'application/json',
            // Add any authentication headers here if needed
        }
    };
});

// Advanced cache configuration with comprehensive type policies
const cache = new InMemoryCache({
    typePolicies: {
        Employee: {
            keyFields: ['id'],
            fields: {
                salary: { merge: false },
            }
        },
        Department: {
            keyFields: ['id'],
            fields: {
                floor: { merge: false },
            }
        },
        Query: {
            fields: {
                getAllEmployees: {
                    merge: false,
                    read: existing => existing,
                },
                getDepartments: {
                    merge: false,
                    read: existing => existing,
                },
                getEmployeeDetails: {
                    merge: false,
                    read: existing => existing,
                },
                getEmployeesByDepartment: {
                    merge: false,
                    read: existing => existing,
                }
            }
        }
    },
    possibleTypes: {},
    resultCaching: true,
});

const client = new ApolloClient({
    link: authLink.concat(httpLink),
    cache,
    defaultOptions: {
        watchQuery: {
            errorPolicy: 'all',
            notifyOnNetworkStatusChange: false,
            fetchPolicy: 'cache-first',
            pollInterval: 0,
        },
        query: {
            errorPolicy: 'all',
            fetchPolicy: 'cache-first',
        },
        mutate: {
            errorPolicy: 'all',
            refetchQueries: 'active',
        },
    },
    assumeImmutableResults: true,
});

export default client;
