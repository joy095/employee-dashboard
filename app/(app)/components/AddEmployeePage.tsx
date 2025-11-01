'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { useRouter } from 'next/navigation';

const ADD_EMPLOYEE = gql`
  mutation AddEmployee($name: String!, $position: String!, $department: String!, $salary: Float!) {
    addEmployee(name: $name, position: $position, department: $department, salary: $salary) {
      id
      name
      position
      department
      salary
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

// Define TypeScript types for GraphQL data
interface Department {
    id: string;
    name: string;
}

interface GetDepartmentsData {
    getDepartments: Department[];
}

interface FormData {
    name: string;
    position: string;
    department: string;
    salary: string;
}

export default function AddEmployeePage() {
    const router = useRouter();

    const [formData, setFormData] = useState<FormData>({
        name: '',
        position: '',
        department: '',
        salary: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Use typed query
    const { data: departmentsData, loading: departmentsLoading } =
        useQuery<GetDepartmentsData>(GET_DEPARTMENTS);

    const [addEmployee, { loading: mutationLoading }] = useMutation(ADD_EMPLOYEE);

    // Type-safe departments list
    const departments = useMemo(
        () => departmentsData?.getDepartments ?? [],
        [departmentsData]
    );

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
            const { name, value } = e.target;
            setFormData(prev => ({
                ...prev,
                [name]: value,
            }));

            if (errors[name]) {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors[name];
                    return newErrors;
                });
            }
        },
        [errors]
    );

    const validate = useCallback((): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) newErrors.name = 'Name is required';
        else if (formData.name.trim().length < 2)
            newErrors.name = 'Name must be at least 2 characters';

        if (!formData.position.trim()) newErrors.position = 'Position is required';
        else if (formData.position.trim().length < 2)
            newErrors.position = 'Position must be at least 2 characters';

        if (!formData.department) newErrors.department = 'Department is required';

        if (!formData.salary) newErrors.salary = 'Salary is required';
        else {
            const salaryValue = parseFloat(formData.salary);
            if (isNaN(salaryValue) || salaryValue <= 0)
                newErrors.salary = 'Salary must be a positive number';
            else if (salaryValue < 1000)
                newErrors.salary = 'Salary must be at least $1,000';
            else if (salaryValue > 1000000)
                newErrors.salary = 'Salary cannot exceed $1,000,000';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            if (!validate()) return;

            try {
                await addEmployee({
                    variables: {
                        name: formData.name.trim(),
                        position: formData.position.trim(),
                        department: formData.department,
                        salary: parseFloat(formData.salary),
                    },
                });

                router.push('/');
            } catch (err: any) {
                console.error('Error adding employee:', err);
                setErrors({
                    submit: err.message || 'An error occurred while adding the employee',
                });
            }
        },
        [addEmployee, formData, validate, router]
    );

    const handleGoBack = useCallback(() => router.back(), [router]);

    if (departmentsLoading) {
        return (
            <div className="container mx-auto py-8 px-4">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4 max-w-2xl">
            <div className="mb-6">
                <button
                    onClick={handleGoBack}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg flex items-center cursor-pointer"
                >
                    ← Back
                </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Add New Employee</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Name *
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'
                                }`}
                            placeholder="Enter employee name"
                        />
                        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                    </div>

                    <div>
                        <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
                            Position *
                        </label>
                        <input
                            type="text"
                            id="position"
                            name="position"
                            value={formData.position}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.position ? 'border-red-500' : 'border-gray-300'
                                }`}
                            placeholder="Enter position"
                        />
                        {errors.position && <p className="mt-1 text-sm text-red-600">{errors.position}</p>}
                    </div>

                    <div>
                        <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                            Department *
                        </label>
                        <select
                            id="department"
                            name="department"
                            value={formData.department}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.department ? 'border-red-500' : 'border-gray-300'
                                }`}
                        >
                            <option value="">Select a department</option>
                            {departments.map(dept => (
                                <option key={dept.id} value={dept.name}>
                                    {dept.name}
                                </option>
                            ))}
                        </select>
                        {errors.department && <p className="mt-1 text-sm text-red-600">{errors.department}</p>}
                    </div>

                    <div>
                        <label htmlFor="salary" className="block text-sm font-medium text-gray-700 mb-1">
                            Salary *
                        </label>
                        <input
                            type="number"
                            id="salary"
                            name="salary"
                            value={formData.salary}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.salary ? 'border-red-500' : 'border-gray-300'
                                }`}
                            placeholder="Enter salary"
                            min="0"
                            step="0.01"
                        />
                        {errors.salary && <p className="mt-1 text-sm text-red-600">{errors.salary}</p>}
                    </div>

                    {errors.submit && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                            {errors.submit}
                        </div>
                    )}

                    <div className="flex gap-4 pt-4">
                        <button
                            type="submit"
                            disabled={mutationLoading}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg disabled:opacity-50 cursor-pointer"
                        >
                            {mutationLoading ? 'Adding...' : 'Add Employee'}
                        </button>
                        <button
                            type="button"
                            onClick={handleGoBack}
                            className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-6 rounded-lg cursor-pointer"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
