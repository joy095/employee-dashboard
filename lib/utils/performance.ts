/**
 * Performance monitoring and optimization utilities
 * Industry-grade performance tracking and optimization
 */

interface PerformanceMetrics {
    queryTime: number;
    cacheHit: boolean;
    dataSize: number;
    timestamp: number;
}

class PerformanceMonitor {
    private metrics: PerformanceMetrics[] = [];
    private readonly maxMetrics = 1000;

    /**
     * Record performance metrics for a GraphQL operation
     */
    recordMetric(metric: PerformanceMetrics): void {
        this.metrics.push(metric);

        // Keep only the latest metrics to prevent memory leaks
        if (this.metrics.length > this.maxMetrics) {
            this.metrics = this.metrics.slice(-this.maxMetrics);
        }
    }

    /**
     * Get performance statistics
     */
    getStats(): {
        averageQueryTime: number;
        cacheHitRate: number;
        totalQueries: number;
        averageDataSize: number;
    } {
        if (this.metrics.length === 0) {
            return {
                averageQueryTime: 0,
                cacheHitRate: 0,
                totalQueries: 0,
                averageDataSize: 0,
            };
        }

        const totalTime = this.metrics.reduce((sum, m) => sum + m.queryTime, 0);
        const cacheHits = this.metrics.filter(m => m.cacheHit).length;
        const totalDataSize = this.metrics.reduce((sum, m) => sum + m.dataSize, 0);

        return {
            averageQueryTime: totalTime / this.metrics.length,
            cacheHitRate: (cacheHits / this.metrics.length) * 100,
            totalQueries: this.metrics.length,
            averageDataSize: totalDataSize / this.metrics.length,
        };
    }

    /**
     * Clear old metrics (older than 1 hour)
     */
    clearOldMetrics(): void {
        const oneHourAgo = Date.now() - 3600000;
        this.metrics = this.metrics.filter(m => m.timestamp > oneHourAgo);
    }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Performance optimization utilities
 */
export class PerformanceOptimizer {
    /**
     * Debounce function for search inputs
     */
    static debounce<T extends (...args: any[]) => any>(
        func: T,
        wait: number
    ): (...args: Parameters<T>) => void {
        let timeout: NodeJS.Timeout;
        return (...args: Parameters<T>) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    }

    /**
     * Throttle function for high-frequency events
     */
    static throttle<T extends (...args: any[]) => any>(
        func: T,
        limit: number
    ): (...args: Parameters<T>) => void {
        let inThrottle: boolean;
        return (...args: Parameters<T>) => {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => (inThrottle = false), limit);
            }
        };
    }

    /**
     * Memoize expensive computations
     */
    static memoize<T extends (...args: any[]) => any>(
        func: T,
        keyGenerator?: (...args: Parameters<T>) => string
    ): T {
        const cache = new Map<string, ReturnType<T>>();

        return ((...args: Parameters<T>) => {
            const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

            if (cache.has(key)) {
                return cache.get(key);
            }

            const result = func(...args);
            cache.set(key, result);
            return result;
        }) as T;
    }

    /**
     * Batch operations for better performance
     */
    static batch<T>(
        items: T[],
        batchSize: number,
        processor: (batch: T[]) => Promise<void>
    ): Promise<void> {
        const batches: T[][] = [];
        for (let i = 0; i < items.length; i += batchSize) {
            batches.push(items.slice(i, i + batchSize));
        }

        return Promise.all(batches.map(processor)).then(() => { });
    }
}

/**
 * Cache optimization utilities
 */
export class CacheOptimizer {
    /**
     * Generate cache keys with versioning
     */
    static generateCacheKey(baseKey: string, version: string = 'v1'): string {
        return `${baseKey}:${version}`;
    }

    /**
     * Check if cache entry is still valid
     */
    static isCacheValid(timestamp: number, ttl: number): boolean {
        return Date.now() - timestamp < ttl;
    }

    /**
     * Calculate optimal TTL based on data type
     */
    static calculateTTL(dataType: 'employees' | 'departments' | 'employee-details'): number {
        const ttlMap = {
            'employees': 300000, // 5 minutes
            'departments': 1800000, // 30 minutes
            'employee-details': 600000, // 10 minutes
        };

        return ttlMap[dataType];
    }
}

/**
 * Database optimization utilities
 */
export class DatabaseOptimizer {
    /**
     * Optimize MongoDB queries with proper indexing hints
     */
    static getOptimizedQuery(collection: string, filters: any = {}) {
        const baseQuery = { collection, filters };

        // Add index hints for common queries
        if (collection === 'employees') {
            return {
                ...baseQuery,
                hints: [
                    { name: 1, position: 1 }, // Compound index for search
                    { department: 1 }, // Department filter index
                ]
            };
        }

        return baseQuery;
    }

    /**
     * Batch database operations
     */
    static async batchInsert<T>(
        collection: any,
        documents: T[],
        batchSize: number = 100
    ): Promise<void> {
        for (let i = 0; i < documents.length; i += batchSize) {
            const batch = documents.slice(i, i + batchSize);
            await collection.insertMany(batch);
        }
    }
}
