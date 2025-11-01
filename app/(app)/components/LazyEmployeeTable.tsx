"use client";

import React, { Suspense } from "react";
import { LazyWrapper } from "@/lib/components/LazyWrapper";
import { ComponentLoadingFallback } from "@/lib/components/LoadingSpinner";

// Lazy load the EmployeeTable component
const EmployeeTable = React.lazy(() => import("./EmployeeTable"));

interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  views: number;
  salary: string;
}

interface LazyEmployeeTableProps {
  employees: Employee[];
}

/**
 * Lazy-loaded EmployeeTable with intersection observer
 * Only loads the table component when it's about to enter the viewport
 * This is especially beneficial for large employee lists
 */
export default function LazyEmployeeTable({
  employees,
}: LazyEmployeeTableProps) {
  return (
    <LazyWrapper
      fallback={
        <ComponentLoadingFallback message="Loading employee table..." />
      }
      rootMargin="100px"
      threshold={0.1}
      className="bg-white rounded-lg shadow overflow-hidden"
    >
      <Suspense
        fallback={<ComponentLoadingFallback message="Rendering table..." />}
      >
        <EmployeeTable employees={employees} />
      </Suspense>
    </LazyWrapper>
  );
}
