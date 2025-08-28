import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  Star, 
  Clock, 
  Users, 
  Briefcase,
  Play,
  Heart,
  Share2,
  Download,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorkflowTemplate } from '../../shared/workflow-templates';

interface WorkflowTemplateBrowserProps {
  onSelectTemplate: (template: WorkflowTemplate) => void;
}

export function WorkflowTemplateBrowser({ onSelectTemplate }: WorkflowTemplateBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [selectedBusinessType, setSelectedBusinessType] = useState<string>('all');
  const [selectedComplexity, setSelectedComplexity] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data, isLoading } = useQuery({
    queryKey: ['/api/workflow-templates', searchQuery, selectedIndustry, selectedBusinessType, selectedComplexity],
  });

  const templates = (data as any)?.templates || [];
  
  const filteredTemplates = templates.filter((template: WorkflowTemplate) => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesIndustry = selectedIndustry === 'all' || template.industry === selectedIndustry;
    const matchesBusinessType = selectedBusinessType === 'all' || template.businessType === selectedBusinessType;
    const matchesComplexity = selectedComplexity === 'all' || template.complexity === selectedComplexity;

    return matchesSearch && matchesIndustry && matchesBusinessType && matchesComplexity;
  });

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'BASIC': return 'bg-green-100 text-green-800';
      case 'INTERMEDIATE': return 'bg-yellow-100 text-yellow-800';
      case 'ADVANCED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBusinessTypeIcon = (businessType: string) => {
    switch (businessType) {
      case 'SME': return <Briefcase className="h-4 w-4" />;
      case 'FREELANCER': return <Users className="h-4 w-4" />;
      case 'STARTUP': return <Play className="h-4 w-4" />;
      default: return <Briefcase className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Browse Templates</h3>
          <p className="text-sm text-gray-600">Select from UAE-compliant workflow templates</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 px-3">
            <Heart className="h-3 w-3 mr-2" />
            Saved
          </Button>
          <Button variant="outline" size="sm" className="h-8 px-3">
            <Share2 className="h-3 w-3 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by template name, industry, or features..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Industries</SelectItem>
              <SelectItem value="Retail">Retail</SelectItem>
              <SelectItem value="Professional Services">Professional Services</SelectItem>
              <SelectItem value="Manufacturing">Manufacturing</SelectItem>
              <SelectItem value="Technology">Technology</SelectItem>
              <SelectItem value="Healthcare">Healthcare</SelectItem>
              <SelectItem value="Construction">Construction</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedBusinessType} onValueChange={setSelectedBusinessType}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Business Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="SME">SME</SelectItem>
              <SelectItem value="FREELANCER">Freelancer</SelectItem>
              <SelectItem value="STARTUP">Startup</SelectItem>
              <SelectItem value="FREEZONE">Free Zone</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedComplexity} onValueChange={setSelectedComplexity}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Complexity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="BASIC">Basic</SelectItem>
              <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
              <SelectItem value="ADVANCED">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Count and View Toggle */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} found
        </p>
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'grid' | 'list')}>
          <TabsList>
            <TabsTrigger value="grid">Grid</TabsTrigger>
            <TabsTrigger value="list">List</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Templates Grid/List */}
      <div className={cn(
        viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
          : "space-y-4"
      )}>
        {filteredTemplates.map((template: WorkflowTemplate) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer group">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  {getBusinessTypeIcon(template.businessType)}
                  <Badge variant="outline" className={getComplexityColor(template.complexity)}>
                    {template.complexity}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {template.rating?.toFixed(1) || 'N/A'}
                </div>
              </div>
              <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                {template.name}
              </CardTitle>
              <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {template.estimatedDuration}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {template.usageCount} uses
                </div>
              </div>

              <div className="flex items-center gap-1 text-sm">
                <Badge variant="secondary" className="text-xs">
                  {template.industry}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {template.businessType}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-1">
                {template.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
                {template.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{template.tags.length - 3} more
                  </Badge>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm" 
                  className="flex-1"
                  onClick={() => onSelectTemplate(template)}
                >
                  <Play className="h-3 w-3 mr-1" />
                  Use Template
                </Button>
                <Button size="sm" variant="outline">
                  <Eye className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="outline">
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your search criteria or filters</p>
          <Button 
            variant="outline"
            onClick={() => {
              setSearchQuery('');
              setSelectedIndustry('all');
              setSelectedBusinessType('all');
              setSelectedComplexity('all');
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}