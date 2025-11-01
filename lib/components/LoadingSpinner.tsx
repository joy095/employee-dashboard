import React from 'react';

/**
 * Reusable loading spinner component for lazy loaded components
 * Provides consistent loading experience across the application
 */
export const LoadingSpinner: React.FC<{
    size?: 'sm' | 'md' | 'lg';
    message?: string;
    className?: string;
}> = ({
    size = 'md',
    message = 'Loading...',
    className = ''
}) => {
        const sizeClasses = {
            sm: 'h-6 w-6',
            md: 'h-12 w-12',
            lg: 'h-16 w-16'
        };

        return (
            <div className={`flex flex-col justify-center items-center h-64 ${className}`}>
                <div className={`animate-spin rounded-full border-t-2 border-b-2 border-blue-500 ${sizeClasses[size]}`}></div>
                {message && (
                    <p className="mt-4 text-gray-600 text-sm">{message}</p>
                )}
            </div>
        );
    };

/**
 * Page-level loading component for lazy loaded pages
 * Provides a full-page loading experience
 */
export const PageLoadingSpinner: React.FC<{ message?: string }> = ({
    message = 'Loading page...'
}) => (
    <div className="container mx-auto py-8 px-4">
        <LoadingSpinner size="lg" message={message} />
    </div>
);

/**
 * Component-level loading fallback for Suspense boundaries
 * Used for smaller components that are lazy loaded
 */
export const ComponentLoadingFallback: React.FC<{ message?: string }> = ({
    message = 'Loading component...'
}) => (
    <div className="flex justify-center items-center p-8">
        <LoadingSpinner size="md" message={message} />
    </div>
);
