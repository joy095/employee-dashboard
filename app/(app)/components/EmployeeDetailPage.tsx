"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { notFound } from "next/navigation";
import { useCachePolicy } from "@/lib/hooks/useAutoRefresh";

const GET_EMPLOYEE_DETAILS = gql`
  query GetEmployeeDetails($id: ID!) {
    getEmployeeDetails(id: $id) {
      id
      name
      position
      department
      salary
      views
    }
  }
`;

interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  salary: number;
  views: number;
}

interface GetEmployeeDetailsData {
  getEmployeeDetails: Employee;
}

interface GetEmployeeDetailsVars {
  id: string;
}

interface Props {
  params: Promise<{ id: string }>;
}

const EmployeeDetail = React.memo(({ employee }: { employee: Employee }) => (
  <div className="bg-white p-6 rounded-lg shadow">
    <h2 className="text-xl font-semibold text-gray-800 mb-4">
      Employee Details
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <p className="text-gray-600">Name</p>
        <p className="font-medium">{employee.name}</p>
      </div>
      <div>
        <p className="text-gray-600">Position</p>
        <p className="font-medium">{employee.position}</p>
      </div>
      <div>
        <p className="text-gray-600">Department</p>
        <p className="font-medium">{employee.department}</p>
      </div>
      <div>
        <p className="text-gray-600">Salary</p>
        <p className="font-medium">${employee.salary.toLocaleString()}</p>
      </div>
      <div>
        <p className="text-gray-600">Views</p>
        <p className="font-medium">{employee.views}</p>
      </div>
    </div>
  </div>
));

EmployeeDetail.displayName = "EmployeeDetail";

export default function EmployeeDetailPage({ params }: Props) {
  const { setEmployeeDetailsCachePolicy } = useCachePolicy();

  // ✅ Properly unwrap params Promise using useEffect
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    params.then((resolved) => {
      if (isMounted) setId(resolved.id);
    });
    return () => {
      isMounted = false;
    };
  }, [params]);

  const { data, loading, error, refetch } = useQuery<
    GetEmployeeDetailsData,
    GetEmployeeDetailsVars
  >(GET_EMPLOYEE_DETAILS, {
    variables: { id: id ?? "" },
    ...setEmployeeDetailsCachePolicy(),
    errorPolicy: "all",
    skip: !id,
  });

  // ✅ Refetch whenever `id` changes
  useEffect(() => {
    if (id) {
      refetch({ id });
    }
  }, [id, refetch]);

  const handleGoBack = useCallback(() => {
    window.history.back();
  }, []);

  if (!id) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div>Loading employee ID...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    console.error("GraphQL Error in EmployeePage:", error);
    if (error.message.includes("Employee not found")) {
      notFound();
    }
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error.message}
        </div>
        <button
          onClick={handleGoBack}
          className="mt-4 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!data?.getEmployeeDetails) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <button
          onClick={handleGoBack}
          className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg flex items-center cursor-pointer"
        >
          ← Back to Employees
        </button>
      </div>

      <EmployeeDetail employee={data.getEmployeeDetails} />
    </div>
  );
}
