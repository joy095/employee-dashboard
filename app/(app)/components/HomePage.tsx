"use client";

import React, { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
// Import hooks from the react-specific entry point
import { useQuery } from "@apollo/client/react"; // Add useReactiveVar if needed for global state
import { gql } from "@apollo/client";
// Import custom hooks for cache management
import { useCachePolicy } from "@/lib/hooks/useAutoRefresh";
// Import lazy-loaded components
import LazyEmployeeTable from "./LazyEmployeeTable";

// Keep the original query for server data
const GET_ALL_EMPLOYEES_SERVER = gql`
  query GetAllEmployees {
    getAllEmployees {
      id
      name
      position
      department
      salary
      views
    }
  }
`;

const GET_DEPARTMENTS = gql`
  query GetDepartments {
    getDepartments {
      id
      name
    }
  }
`;

interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  views: number;
  salary: string;
}

interface Department {
  id: string;
  name: string;
}

/**
 * Main HomePage component with comprehensive optimizations
 * Features: React.memo, useMemo, useCallback, prefetch on hover, refetch after mutations
 */
export default function HomePage() {
  const router = useRouter();

  // Initialize cache management hooks
  const { setEmployeesCachePolicy, setDepartmentsCachePolicy } =
    useCachePolicy();

  // Optimized queries with intelligent cache policies
  const {
    data: employeesData,
    loading: employeesLoading,
    error: employeesError,
  } = useQuery(GET_ALL_EMPLOYEES_SERVER, {
    ...setEmployeesCachePolicy(),
    // Enable error recovery
    errorPolicy: "all",
    // Disable network status notifications to prevent duplicate renders
    notifyOnNetworkStatusChange: false,
  });

  const { data: departmentsData, loading: departmentsLoading } = useQuery(
    GET_DEPARTMENTS,
    {
      ...setDepartmentsCachePolicy(),
      errorPolicy: "all",
    }
  );

  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [departmentSearch, setDepartmentSearch] = useState<string>("");

  /**
   * Memoized departments list to prevent unnecessary recalculations
   * Only updates when departmentsData changes
   */
  const departments = useMemo(
    () =>
      (departmentsData as { getDepartments?: Department[] })?.getDepartments ||
      [],
    [departmentsData]
  );

  /**
   * Filtered departments based on search term
   */
  const filteredDepartments = useMemo(() => {
    if (!departmentSearch.trim()) return departments;

    return departments.filter((dept: Department) =>
      dept.name.toLowerCase().includes(departmentSearch.toLowerCase())
    );
  }, [departments, departmentSearch]);

  /**
   * Memoized employees list to prevent unnecessary recalculations
   * Only updates when employeesData changes
   */
  const allEmployees = useMemo(
    () =>
      (employeesData as { getAllEmployees?: Employee[] })?.getAllEmployees ||
      [],
    [employeesData]
  );

  /**
   * Optimized filtered employees with memoization
   * Only recalculates when dependencies change (allEmployees, selectedDepartment, searchTerm)
   * Implements efficient filtering with early returns
   */
  const filteredEmployees = useMemo(() => {
    let result = allEmployees;

    // Early return if no employees
    if (!result.length) return result;

    // Filter by department if not 'all'
    if (selectedDepartment !== "all") {
      result = result.filter(
        (emp: Employee) =>
          emp.department &&
          emp.department.toLowerCase() === selectedDepartment.toLowerCase()
      );
    }

    // Filter by search term if provided
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(
        (emp: Employee) =>
          emp.name.toLowerCase().includes(term) ||
          emp.position.toLowerCase().includes(term)
      );
    }

    return result;
  }, [allEmployees, selectedDepartment, searchTerm]);

  // Department change is now handled by the interactive filter

  /**
   * Memoized search change handler with debouncing consideration
   * Prevents unnecessary re-renders of child components
   */
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
    },
    []
  );

  /**
   * Handle department search change
   */
  const handleDepartmentSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setDepartmentSearch(e.target.value);
    },
    []
  );

  /**
   * Handle department selection
   */
  const handleDepartmentSelect = useCallback((deptName: string) => {
    setSelectedDepartment(deptName.toLowerCase());
    setIsFilterOpen(false);
    setDepartmentSearch("");
  }, []);

  /**
   * Clear department filter
   */
  const handleClearDepartmentFilter = useCallback(() => {
    setSelectedDepartment("all");
    setIsFilterOpen(false);
    setDepartmentSearch("");
  }, []);

  /**
   * Toggle filter dropdown
   */
  const handleToggleFilter = useCallback(() => {
    setIsFilterOpen((prev) => !prev);
    if (!isFilterOpen) {
      setDepartmentSearch("");
    }
  }, [isFilterOpen]);

  /**
   * Handle keyboard navigation in filter dropdown
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isFilterOpen) return;

      switch (e.key) {
        case "Escape":
          setIsFilterOpen(false);
          setDepartmentSearch("");
          break;
        case "Enter":
          if (filteredDepartments.length === 1) {
            handleDepartmentSelect(filteredDepartments[0].name);
          }
          break;
      }
    },
    [isFilterOpen, filteredDepartments, handleDepartmentSelect]
  );

  // Automatic cache refresh is handled by Apollo Client configuration
  // No manual refetch needed with the optimized cache policies

  // Cache management is handled automatically by Apollo Client

  /**
   * Memoized loading component to prevent unnecessary re-renders
   */
  const LoadingSpinner = useMemo(
    () => (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    ),
    []
  );

  if (employeesLoading || departmentsLoading) {
    return LoadingSpinner;
  }

  if (employeesError) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {employeesError.message}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Employee Directory</h1>
        <Link
          href="/add-employee"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          onMouseEnter={() => router.prefetch("/add-employee")}
          onClick={() => {
            // Optional: Clear any filters when navigating to add
            // setSelectedDepartment('all');
            // setSearchTerm('');
          }}
        >
          Add New Employee
        </Link>
      </div>

      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="relative">
          {/* Interactive Department Filter */}
          <div className="relative">
            <button
              type="button"
              onClick={handleToggleFilter}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-left flex items-center justify-between cursor-pointer"
            >
              <span className="truncate">
                {selectedDepartment === "all"
                  ? "All Departments"
                  : departments.find(
                      (d: Department) =>
                        d.name.toLowerCase() === selectedDepartment
                    )?.name || "All Departments"}
              </span>
              <svg
                className={`w-5 h-5 transition-transform duration-200 ${
                  isFilterOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Filter Dropdown */}
            {isFilterOpen && (
              <div
                className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden"
                onKeyDown={handleKeyDown}
              >
                {/* Search Input */}
                <div className="p-3 border-b border-gray-200">
                  <input
                    type="text"
                    placeholder="Search departments..."
                    value={departmentSearch}
                    onChange={handleDepartmentSearchChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    autoFocus
                  />
                </div>

                {/* Department Options */}
                <div className="max-h-48 overflow-y-auto">
                  {/* All Departments Option */}
                  <button
                    onClick={handleClearDepartmentFilter}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between ${
                      selectedDepartment === "all"
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700"
                    }`}
                  >
                    <span>All Departments</span>
                    {selectedDepartment === "all" && (
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>

                  {/* Department List */}
                  {filteredDepartments.length > 0 ? (
                    filteredDepartments.map((dept: Department) => (
                      <button
                        key={dept.id}
                        onClick={() => handleDepartmentSelect(dept.name)}
                        className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between ${
                          selectedDepartment === dept.name.toLowerCase()
                            ? "bg-blue-50 text-blue-600"
                            : "text-gray-700"
                        }`}
                      >
                        <span>{dept.name}</span>
                        {selectedDepartment === dept.name.toLowerCase() && (
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-gray-500 text-sm">
                      No departments found
                    </div>
                  )}
                </div>

                {/* Clear Filter Button */}
                {selectedDepartment !== "all" && (
                  <div className="p-3 border-t border-gray-200">
                    <button
                      onClick={handleClearDepartmentFilter}
                      className="w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      Clear Filter
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Click outside to close */}
          {isFilterOpen && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsFilterOpen(false)}
            />
          )}
        </div>
      </div>

      {/* Filter Status */}
      {(selectedDepartment !== "all" || searchTerm.trim()) && (
        <div className="mb-4 flex flex-wrap gap-2">
          {selectedDepartment !== "all" && (
            <div className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              <span>
                Department:{" "}
                {
                  departments.find(
                    (d: Department) =>
                      d.name.toLowerCase() === selectedDepartment
                  )?.name
                }
              </span>
              <button
                onClick={handleClearDepartmentFilter}
                className="hover:bg-blue-200 rounded-full p-1"
              >
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          )}
          {searchTerm.trim() && (
            <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
              <span>Search: &quot;{searchTerm}&quot;</span>
              <button
                onClick={() => setSearchTerm("")}
                className="hover:bg-green-200 rounded-full p-1"
              >
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          )}
          <button
            onClick={() => {
              setSelectedDepartment("all");
              setSearchTerm("");
            }}
            className="text-gray-600 hover:text-gray-800 text-sm underline"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {filteredEmployees.length} of {allEmployees.length} employees
        {(selectedDepartment !== "all" || searchTerm.trim()) && (
          <span className="ml-2 text-blue-600">(filtered)</span>
        )}
      </div>

      <LazyEmployeeTable employees={filteredEmployees} />
    </div>
  );
}
