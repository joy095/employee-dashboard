import LazyEmployeeDetailPage from '../../components/LazyEmployeeDetailPage';

interface Props {
    params: Promise<{ id: string }>;
}

/**
 * Employee detail page route that uses lazy loading for the EmployeeDetailPage component
 * This improves initial page load performance by code-splitting the detail component
 */
export default function Page({ params }: Props) {
    return <LazyEmployeeDetailPage params={params} />;
}