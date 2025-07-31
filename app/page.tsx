// app/page.js
import fs from 'fs';
import path from 'path';
import Link from 'next/link';

// Function to get all page routes from the app directory
function getPageRoutes() {
    const appDir = path.join(process.cwd(), 'app');
    const routes: { path: string; name: string; }[] = [];

    function scanDirectory(dir: fs.PathLike, basePath = '') {
        const items = fs.readdirSync(dir, { withFileTypes: true });

        for (const item of items) {
            if (item.isDirectory()) {
                const dirPath = path.join(dir, item.name);
                const routePath = `${basePath}/${item.name}`;

                // Check if directory has a page.js/jsx/ts/tsx file
                const pageFiles = ['page.js', 'page.jsx', 'page.ts', 'page.tsx'];
                const hasPageFile = pageFiles.some(file =>
                    fs.existsSync(path.join(dirPath, file))
                );

                if (hasPageFile && routePath !== '/') { // Exclude home page
                    routes.push({
                        path: routePath,
                        name: item.name
                            .split('-')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ')
                    });
                }

                // Recursively scan subdirectories
                scanDirectory(dirPath, routePath);
            }
        }
    }

    scanDirectory(appDir);
    return routes.sort((a, b) => a.path.localeCompare(b.path));
}

export default function HomePage() {
    const routes = getPageRoutes();

    return (
        <div className="min-h-screen p-8 bg-gray-50">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-gray-900 mb-8">
                    Welcome to The IFDM Lessons and Games
                </h1>
                <div>
                    <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-2xl">
                        This page helps developers find the pages they're working on quicker.
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                        Available Pages
                    </h2>

                    {routes.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {routes.map((route) => (
                                <Link
                                    key={route.path}
                                    href={route.path}
                                    className="block p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all duration-200 group"
                                >
                                    <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600">
                                        {route.name}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {route.path}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-600">
                            No pages found. Create some pages in the app directory!
                        </p>
                    )}
                </div>

                <div className="mt-8 text-center">
                    <p className="text-gray-600">
                        This page automatically updates when you add new pages to your app directory.
                    </p>
                </div>
            </div>
        </div>
    );
}
