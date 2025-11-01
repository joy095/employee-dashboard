import LazyAddEmployeePage from '../components/LazyAddEmployeePage';

/**
 * Add employee page route that uses lazy loading for the AddEmployeePage component
 * This improves initial page load performance by code-splitting the form component
 */
export default function Page() {
    return <LazyAddEmployeePage />;
}