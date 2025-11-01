'use client';

import React, { useState, useEffect, useRef } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface LazyWrapperProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    rootMargin?: string;
    threshold?: number;
    className?: string;
}

/**
 * LazyWrapper component that uses Intersection Observer API
 * to load components only when they're about to enter the viewport
 * This provides better performance than loading all components immediately
 */
export const LazyWrapper: React.FC<LazyWrapperProps> = ({
    children,
    fallback = <LoadingSpinner size="md" message="Loading..." />,
    rootMargin = '50px',
    threshold = 0.1,
    className = ''
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);
    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasLoaded) {
                    setIsVisible(true);
                    setHasLoaded(true);
                    observer.disconnect();
                }
            },
            {
                rootMargin,
                threshold,
            }
        );

        if (elementRef.current) {
            observer.observe(elementRef.current);
        }

        return () => {
            observer.disconnect();
        };
    }, [rootMargin, threshold, hasLoaded]);

    return (
        <div ref={elementRef} className={className}>
            {isVisible ? children : fallback}
        </div>
    );
};

/**
 * Hook for lazy loading with intersection observer
 * Can be used for more complex lazy loading scenarios
 */
export const useLazyLoad = (
    rootMargin: string = '50px',
    threshold: number = 0.1
) => {
    const [isVisible, setIsVisible] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);
    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasLoaded) {
                    setIsVisible(true);
                    setHasLoaded(true);
                    observer.disconnect();
                }
            },
            {
                rootMargin,
                threshold,
            }
        );

        if (elementRef.current) {
            observer.observe(elementRef.current);
        }

        return () => {
            observer.disconnect();
        };
    }, [rootMargin, threshold, hasLoaded]);

    return { elementRef, isVisible, hasLoaded };
};
