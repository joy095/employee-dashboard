import { useCallback } from "react";
import { useApolloClient } from "@apollo/client/react";

/**
 * Custom hook for automatic cache refresh and management
 * Provides intelligent cache invalidation and refresh strategies
 */
export const useAutoRefresh = () => {
  const client = useApolloClient();

  /**
   * Refresh employees cache when new employee is added
   * Automatically called after mutations
   */
  const refreshEmployees = useCallback(async () => {
    try {
      await client.refetchQueries({
        include: ["GetAllEmployees"],
      });
    } catch (error) {
      console.error("Error refreshing employees cache:", error);
    }
  }, [client]);

  /**
   * Refresh departments cache
   * Called when departments might have changed
   */
  const refreshDepartments = useCallback(async () => {
    try {
      await client.refetchQueries({
        include: ["GetDepartments"],
      });
    } catch (error) {
      console.error("Error refreshing departments cache:", error);
    }
  }, [client]);

  /**
   * Clear all caches and refetch
   * Used for complete data refresh
   */
  const clearAndRefreshAll = useCallback(async () => {
    try {
      await client.clearStore();
      await client.refetchQueries({ include: ["GetAllEmployees"] });
    } catch (error) {
      console.error("Error clearing and refreshing cache:", error);
    }
  }, [client]);

  // Removed automatic refresh effects to prevent duplicate data
  // Data will be refreshed only when needed (mutations, manual refresh)

  return {
    refreshEmployees,
    refreshDepartments,
    clearAndRefreshAll,
  };
};

/**
 * Hook for managing cache policies
 * Provides different cache strategies for different data types
 */
export const useCachePolicy = () => {
  const client = useApolloClient();

  /**
   * Set cache policy for employees (frequently changing data)
   */
  const setEmployeesCachePolicy = useCallback(() => {
    return {
      fetchPolicy: "cache-first" as const,
      refetchOnWindowFocus: false,
      pollInterval: 0, // No automatic polling
    };
  }, []);

  /**
   * Set cache policy for departments (rarely changing data)
   */
  const setDepartmentsCachePolicy = useCallback(() => {
    return {
      fetchPolicy: "cache-first" as const,
      refetchOnWindowFocus: false,
      pollInterval: 0, // No automatic polling
    };
  }, []);

  /**
   * Set cache policy for employee details (individual records)
   */
  const setEmployeeDetailsCachePolicy = useCallback(() => {
    return {
      fetchPolicy: "cache-first" as const,
      refetchOnWindowFocus: false,
      pollInterval: 0, // No polling for individual records
    };
  }, []);

  return {
    setEmployeesCachePolicy,
    setDepartmentsCachePolicy,
    setEmployeeDetailsCachePolicy,
  };
};
