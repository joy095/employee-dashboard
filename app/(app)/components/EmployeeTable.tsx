"use client";

import React, { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import LazyEmployeeDetailPage from "../components/LazyEmployeeDetailPage";
import client from "@/lib/apollo-client";

interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  views: number;
  salary: string;
}

/**
 * Optimized EmployeeTable component with React.memo for performance
 * Prevents unnecessary re-renders when parent component updates
 */
const EmployeeTable = React.memo(({ employees }: { employees: Employee[] }) => {
  if (!employees.length) {
    return (
      <div className="text-center py-8 text-gray-500">No employees found</div>
    );
  }

  return (
    <table className="min-w-full bg-white border border-gray-200">
      <thead className="bg-gray-100">
        <tr>
          <th className="py-3 px-4 text-left text-gray-700 font-semibold">
            Name
          </th>
          <th className="py-3 px-4 text-left text-gray-700 font-semibold">
            Position
          </th>
          <th className="py-3 px-4 text-left text-gray-700 font-semibold">
            Views
          </th>
          <th className="py-3 px-4 text-left text-gray-700 font-semibold">
            Salary
          </th>
          <th className="py-3 px-4 text-left text-gray-700 font-semibold">
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        {employees.map((employee) => (
          <EmployeeRow key={employee.id} employee={employee} />
        ))}
      </tbody>
    </table>
  );
});

EmployeeTable.displayName = "EmployeeTable";

/**
 * Individual employee row component with prefetch on hover
 * Optimized with React.memo to prevent unnecessary re-renders
 */
interface EmployeeRowProps {
  employee: Employee;
  onEmployeeDeleted?: (id: string) => void;
}

const EmployeeRow = React.memo(
  ({ employee, onEmployeeDeleted }: EmployeeRowProps) => {
    const router = useRouter();
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [views, setViews] = useState(employee.views);
    const [isDeleted, setIsDeleted] = useState(false);

    const handleMouseEnter = useCallback(() => {
      if (!isDeleted) {
        router.prefetch(`/employee/${employee.id}`);
      }
    }, [router, employee.id, isDeleted]);

    const openPopup = async () => {
      console.log(
        "Client: Attempting to increment view for employee ID:",
        employee.id
      );
      setIsPopupOpen(true);

      try {
        const response = await fetch("/api/graphql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `
              mutation IncrementView($id: ID!) {
                incrementView(id: $id) {
                  id
                  views
                }
              }
            `,
            variables: { id: employee.id },
          }),
        });

        const result = await response.json();

        console.log("Client: GraphQL Response:", result);

        if (result.errors) {
          const errorMessage =
            result.errors[0]?.message || "An unknown error occurred";
          console.error("Client: GraphQL Error:", errorMessage);

          if (errorMessage.includes("Employee not found")) {
            console.warn(
              `Client: Employee with ID ${employee.id} not found on server.`
            );
            setIsDeleted(true);
            closePopup();

            console.log(
              `Employee "${employee.name}" no longer exists. The page will refresh to show updated data.`
            );

            // Notify parent and refresh
            if (onEmployeeDeleted) {
              onEmployeeDeleted(employee.id);
            }

            // Force page refresh to get latest data
            await client.refetchQueries({
              include: ["GetAllEmployees", "GetDepartments"],
            });
            return;
          }

          // Handle other errors
          console.error(`Error: ${errorMessage}`);
          closePopup();
          return;
        }

        if (result.data?.incrementView) {
          console.log(
            "Client: Successfully incremented view, new count:",
            result.data.incrementView.views
          );
          setViews(result.data.incrementView.views);
        } else {
          console.error(
            "Client: No data returned from incrementView mutation."
          );
        }
      } catch (error) {
        console.error("Client: Network or fetch error:", error);
        closePopup();
      }
    };

    const closePopup = () => setIsPopupOpen(false);

    // Don't render if deleted
    if (isDeleted) {
      return null;
    }

    return (
      <>
        <tr
          className="border-t border-gray-200 hover:bg-gray-50"
          onMouseEnter={handleMouseEnter}
        >
          <td className="py-3 px-4">{employee.name}</td>
          <td className="py-3 px-4">{employee.position}</td>
          <td className="py-3 px-4">{views}</td>
          <td className="py-3 px-4">{employee.salary}</td>
          <td className="py-3 px-4">
            <button
              onClick={openPopup}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Open Popup
            </button>
          </td>
        </tr>

        {isPopupOpen && (
          <tr>
            <td colSpan={5} className="p-0">
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                <div className="bg-white p-6 rounded shadow-lg w-96">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Employee Details</h2>
                    <button
                      onClick={closePopup}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ✕
                    </button>
                  </div>
                  <LazyEmployeeDetailPage
                    params={Promise.resolve({ id: employee.id })}
                  />
                  <div className="mt-4 text-right">
                    <button
                      onClick={closePopup}
                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        )}
      </>
    );
  }
);

EmployeeRow.displayName = "EmployeeRow";

export default EmployeeTable;
