import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
    className?: string;
}

/**
 * Accessible breadcrumb navigation component
 * - Uses semantic nav element
 * - ARIA labels for screen readers
 * - Current page marked with aria-current
 * - Keyboard navigable
 */
export const Breadcrumbs = ({ items, className }: BreadcrumbsProps) => {
    if (items.length === 0) return null;

    return (
        <nav
            aria-label="Breadcrumb"
            className={cn('flex items-center space-x-1 text-sm', className)}
        >
            <ol className="flex items-center space-x-1" role="list">
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;
                    const isFirst = index === 0;

                    return (
                        <li key={index} className="flex items-center space-x-1">
                            {!isFirst && (
                                <ChevronRight
                                    className="h-4 w-4 text-muted-foreground"
                                    aria-hidden="true"
                                />
                            )}
                            {item.href && !isLast ? (
                                <Link
                                    to={item.href}
                                    className="text-muted-foreground hover:text-foreground transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded px-1"
                                    aria-label={`Navigate to ${item.label}`}
                                >
                                    {isFirst && <Home className="h-4 w-4 inline mr-1" aria-hidden="true" />}
                                    {item.label}
                                </Link>
                            ) : (
                                <span
                                    className={cn(
                                        'font-medium px-1',
                                        isLast
                                            ? 'text-foreground'
                                            : 'text-muted-foreground'
                                    )}
                                    aria-current={isLast ? 'page' : undefined}
                                >
                                    {isFirst && <Home className="h-4 w-4 inline mr-1" aria-hidden="true" />}
                                    {item.label}
                                </span>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

/**
 * Hook to automatically generate breadcrumbs from current route
 */
export const useBreadcrumbs = () => {
    const location = useLocation();
    
    const generateBreadcrumbs = (): BreadcrumbItem[] => {
        const paths = location.pathname.split('/').filter(Boolean);
        const breadcrumbs: BreadcrumbItem[] = [{ label: 'Home', href: '/' }];
        
        let currentPath = '';
        paths.forEach((path, index) => {
            currentPath += `/${path}`;
            const label = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
            
            // Don't add href for the last item (current page)
            if (index === paths.length - 1) {
                breadcrumbs.push({ label });
            } else {
                breadcrumbs.push({ label, href: currentPath });
            }
        });
        
        return breadcrumbs;
    };
    
    return generateBreadcrumbs();
};
