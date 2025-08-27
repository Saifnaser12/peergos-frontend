import React from 'react';
import { Link } from 'wouter';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
}

export default function Breadcrumb({ items, className, showHome = true }: BreadcrumbProps) {
  const allItems = showHome 
    ? [{ label: 'Dashboard', href: '/' }, ...items]
    : items;

  return (
    <nav className={cn("flex items-center space-x-1 text-sm", className)} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1">
        {allItems.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-gray-400 mx-1" />
            )}
            
            {item.current || !item.href ? (
              <span 
                className={cn(
                  "font-medium",
                  item.current ? "text-gray-900" : "text-gray-500"
                )}
                aria-current={item.current ? "page" : undefined}
              >
                {index === 0 && showHome ? (
                  <span className="flex items-center">
                    <Home className="h-4 w-4 mr-1" />
                    {item.label}
                  </span>
                ) : (
                  item.label
                )}
              </span>
            ) : (
              <Link
                href={item.href}
                className={cn(
                  "text-gray-600 hover:text-gray-900 transition-colors duration-200",
                  "hover:underline"
                )}
              >
                {index === 0 && showHome ? (
                  <span className="flex items-center">
                    <Home className="h-4 w-4 mr-1" />
                    {item.label}
                  </span>
                ) : (
                  item.label
                )}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// Hook for managing breadcrumb state
export function useBreadcrumb() {
  const [items, setItems] = React.useState<BreadcrumbItem[]>([]);

  const updateBreadcrumb = React.useCallback((newItems: BreadcrumbItem[]) => {
    setItems(newItems);
  }, []);

  const addBreadcrumbItem = React.useCallback((item: BreadcrumbItem) => {
    setItems(prev => [...prev, item]);
  }, []);

  const removeBreadcrumbItem = React.useCallback((index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearBreadcrumb = React.useCallback(() => {
    setItems([]);
  }, []);

  return {
    items,
    updateBreadcrumb,
    addBreadcrumbItem,
    removeBreadcrumbItem,
    clearBreadcrumb
  };
}