import LazyHomePage from './components/LazyHomePage';

/**
 * Main page route that uses lazy loading for the HomePage component
 * This improves initial page load performance by code-splitting the main component
 */
export default function Page() {
    return <LazyHomePage />;
}