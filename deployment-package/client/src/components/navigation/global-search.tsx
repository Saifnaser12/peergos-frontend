import React, { useState, useRef, useEffect } from 'react';
import { Search, X, FileText, Calculator, BarChart3, Settings, Users, Clock } from 'lucide-react';
import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: 'page' | 'document' | 'calculation' | 'setting' | 'user' | 'recent';
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords?: string[];
  lastAccessed?: Date;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

// Sample search data - in a real app, this would come from an API
const searchData: SearchResult[] = [
  {
    id: '1',
    title: 'Dashboard',
    description: 'Main dashboard with KPIs and overview',
    category: 'page',
    url: '/',
    icon: BarChart3,
    keywords: ['overview', 'kpi', 'metrics', 'home']
  },
  {
    id: '2',
    title: 'VAT Calculator',
    description: 'Calculate VAT for transactions',
    category: 'calculation',
    url: '/taxes/vat',
    icon: Calculator,
    keywords: ['vat', 'tax', 'calculate', '5%', 'uae']
  },
  {
    id: '3',
    title: 'CIT Calculator',
    description: 'Corporate Income Tax calculations',
    category: 'calculation',
    url: '/taxes/cit',
    icon: Calculator,
    keywords: ['cit', 'corporate', 'income', 'tax', '9%']
  },
  {
    id: '4',
    title: 'Financial Reports',
    description: 'Generate and view financial statements',
    category: 'page',
    url: '/financials',
    icon: FileText,
    keywords: ['reports', 'financial', 'statements', 'balance sheet', 'income']
  },
  {
    id: '5',
    title: 'Tax Settings',
    description: 'Configure tax rates and thresholds',
    category: 'setting',
    url: '/admin/tax-settings',
    icon: Settings,
    keywords: ['settings', 'configure', 'rates', 'thresholds']
  },
  {
    id: '6',
    title: 'User Management',
    description: 'Manage company users and roles',
    category: 'setting',
    url: '/admin/users',
    icon: Users,
    keywords: ['users', 'roles', 'permissions', 'team']
  },
  {
    id: '7',
    title: 'Enhanced Data Entry',
    description: 'Advanced data input with validation',
    category: 'page',
    url: '/enhanced-data-entry',
    icon: FileText,
    keywords: ['data', 'entry', 'input', 'validation', 'bulk']
  },
  {
    id: '8',
    title: 'Calculation Audit',
    description: 'View calculation transparency and audit trails',
    category: 'page',
    url: '/calculation-transparency',
    icon: Calculator,
    keywords: ['audit', 'transparency', 'calculations', 'trail']
  }
];

export default function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [, setLocation] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Search functionality
  useEffect(() => {
    if (!query.trim()) {
      // Show recent items when no query
      setResults(searchData.filter(item => item.category === 'recent').slice(0, 5));
      return;
    }

    const searchQuery = query.toLowerCase();
    const filtered = searchData.filter(item => {
      const titleMatch = item.title.toLowerCase().includes(searchQuery);
      const descMatch = item.description.toLowerCase().includes(searchQuery);
      const keywordMatch = item.keywords?.some(keyword => 
        keyword.toLowerCase().includes(searchQuery)
      );
      return titleMatch || descMatch || keywordMatch;
    });

    // Sort by relevance (title matches first, then description, then keywords)
    filtered.sort((a, b) => {
      const aTitle = a.title.toLowerCase().includes(searchQuery);
      const bTitle = b.title.toLowerCase().includes(searchQuery);
      if (aTitle && !bTitle) return -1;
      if (!aTitle && bTitle) return 1;
      return 0;
    });

    setResults(filtered);
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            handleResultClick(results[selectedIndex]);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  const handleResultClick = (result: SearchResult) => {
    setLocation(result.url);
    onClose();
    setQuery('');
  };

  const getCategoryIcon = (category: SearchResult['category']) => {
    switch (category) {
      case 'page': return BarChart3;
      case 'document': return FileText;
      case 'calculation': return Calculator;
      case 'setting': return Settings;
      case 'user': return Users;
      case 'recent': return Clock;
      default: return Search;
    }
  };

  const getCategoryColor = (category: SearchResult['category']) => {
    switch (category) {
      case 'page': return 'bg-blue-100 text-blue-800';
      case 'document': return 'bg-green-100 text-green-800';
      case 'calculation': return 'bg-purple-100 text-purple-800';
      case 'setting': return 'bg-gray-100 text-gray-800';
      case 'user': return 'bg-orange-100 text-orange-800';
      case 'recent': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Search Modal */}
      <Card className="relative w-full max-w-2xl shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
        <CardContent className="p-0">
          {/* Search Input */}
          <div className="flex items-center border-b border-gray-200 p-4">
            <Search className="h-5 w-5 text-gray-400 mr-3" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pages, calculations, settings..."
              className="border-0 focus:ring-0 text-lg placeholder:text-gray-400"
            />
            <button
              onClick={onClose}
              className="ml-3 p-1 rounded-md hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Search Results */}
          <div 
            ref={resultsRef}
            className="max-h-96 overflow-y-auto custom-scrollbar"
          >
            {results.length === 0 && query ? (
              <div className="p-8 text-center text-gray-500">
                <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No results found</p>
                <p className="text-sm">Try searching for something else</p>
              </div>
            ) : results.length === 0 && !query ? (
              <div className="p-8 text-center text-gray-500">
                <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Start typing to search</p>
                <p className="text-sm">Find pages, calculations, and settings</p>
              </div>
            ) : (
              <div className="py-2">
                {results.map((result, index) => {
                  const IconComponent = result.icon;
                  const CategoryIcon = getCategoryIcon(result.category);
                  
                  return (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result)}
                      className={cn(
                        "w-full text-left p-4 hover:bg-gray-50 transition-colors duration-150",
                        "border-l-4 border-transparent",
                        index === selectedIndex && "bg-blue-50 border-l-blue-500"
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 p-2 rounded-lg bg-gray-100">
                          <IconComponent className="h-5 w-5 text-gray-600" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-medium text-gray-900 truncate">
                              {result.title}
                            </h3>
                            <Badge 
                              variant="secondary" 
                              className={cn("text-xs", getCategoryColor(result.category))}
                            >
                              <CategoryIcon className="h-3 w-3 mr-1" />
                              {result.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 truncate">
                            {result.description}
                          </p>
                        </div>
                        
                        <div className="flex-shrink-0 text-xs text-gray-400">
                          ↵
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-3 bg-gray-50 text-xs text-gray-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span>↑↓ Navigate</span>
                <span>↵ Select</span>
                <span>Esc Close</span>
              </div>
              <div className="flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">⌘</kbd>
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">K</kbd>
                <span>to search</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}