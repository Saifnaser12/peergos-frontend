import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { WorkflowTemplateBrowser } from '@/components/workflows/workflow-template-browser';
import { WorkflowTemplateCustomizer } from '@/components/workflows/workflow-template-customizer';
import { WorkflowTemplateSharing } from '@/components/workflows/workflow-template-sharing';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  BookTemplate, 
  Plus, 
  Sparkles,
  Target,
  Clock,
  Users
} from 'lucide-react';
import type { WorkflowTemplate } from '@shared/workflow-templates';

export default function WorkflowTemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [isCreatingNewTemplate, setIsCreatingNewTemplate] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [showSharing, setShowSharing] = useState(false);
  const [templateToShare, setTemplateToShare] = useState<WorkflowTemplate | null>(null);
  const [activeTab, setActiveTab] = useState('browse');
  const { toast } = useToast();

  const handleSelectTemplate = (template: WorkflowTemplate) => {
    setSelectedTemplate(template);
    setIsCreatingNewTemplate(false);
    setShowCustomizer(true);
  };

  // Mutation for creating new templates
  const createTemplateMutation = useMutation({
    mutationFn: async (templateData: Omit<WorkflowTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'rating'>) => {
      const response = await apiRequest('/api/workflow-templates', {
        method: 'POST',
        body: templateData
      });
      return response.json();
    },
    onSuccess: (newTemplate) => {
      queryClient.invalidateQueries({ queryKey: ['/api/workflow-templates'] });
      toast({
        title: "Template Created",
        description: `"${newTemplate.name}" has been created successfully`
      });
      setShowCustomizer(false);
      setSelectedTemplate(null);
      setIsCreatingNewTemplate(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create template",
        variant: "destructive"
      });
    }
  });

  // Mutation for updating existing templates
  const updateTemplateMutation = useMutation({
    mutationFn: async (template: WorkflowTemplate) => {
      const response = await apiRequest(`/api/workflow-templates/${template.id}`, {
        method: 'PUT',
        body: template
      });
      return response.json();
    },
    onSuccess: (updatedTemplate) => {
      queryClient.invalidateQueries({ queryKey: ['/api/workflow-templates'] });
      queryClient.invalidateQueries({ queryKey: [`/api/workflow-templates/${updatedTemplate.id}`] });
      toast({
        title: "Template Updated",
        description: `"${updatedTemplate.name}" has been updated successfully`
      });
      setShowCustomizer(false);
      setSelectedTemplate(null);
      setIsCreatingNewTemplate(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update template",
        variant: "destructive"
      });
    }
  });

  const handleSaveCustomTemplate = (customizedTemplate: WorkflowTemplate) => {
    if (isCreatingNewTemplate) {
      // This is a new template, create it (remove auto-generated fields)
      const { id, createdAt, updatedAt, usageCount, rating, ...templateData } = customizedTemplate;
      createTemplateMutation.mutate(templateData);
    } else {
      // This is an existing template, update it
      updateTemplateMutation.mutate(customizedTemplate);
    }
  };

  const handleStartFromScratch = () => {
    // Create a blank template with a unique timestamp
    const timestamp = Date.now();
    const blankTemplate: WorkflowTemplate = {
      id: `new-template-${timestamp}`,
      name: 'Custom Workflow',
      description: 'Build your own custom workflow from scratch',
      industry: 'General',
      businessType: 'SME',
      complexity: 'BASIC',
      estimatedDuration: '2-4 hours',
      requirements: [],
      outcomes: [],
      steps: [],
      isPublic: false,
      createdBy: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: ['custom'],
      usageCount: 0
    };
    
    setSelectedTemplate(blankTemplate);
    setIsCreatingNewTemplate(true);
    setShowCustomizer(true);
  };

  const handleShareTemplate = (template: WorkflowTemplate) => {
    setTemplateToShare(template);
    setShowSharing(true);
  };

  const handleCloseSharing = () => {
    setShowSharing(false);
    setTemplateToShare(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900">Workflow Templates</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">
            Industry-specific templates to accelerate your UAE business compliance setup
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="outline" onClick={handleStartFromScratch} className="h-9 text-[13px] font-semibold border-[#E5EAF0] hover:border-[#0A3A5C]/30" data-testid="button-custom-workflow">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Custom Workflow
          </Button>
          <Button
            className="h-9 text-[13px] font-semibold text-white flex items-center gap-1.5"
            style={{ backgroundColor: '#0A3A5C' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#0D4A75')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#0A3A5C')}
            data-testid="button-new-template"
          >
            <Sparkles className="h-3.5 w-3.5" />
            New Template
          </Button>
        </div>
      </div>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-xl border border-[#E5EAF0] shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(14,159,110,0.10)' }}>
                <Target className="h-4 w-4" style={{ color: '#0E9F6E' }} />
              </div>
              <h3 className="text-[13px] font-semibold text-gray-900">Industry Specific</h3>
            </div>
            <p className="text-[12px] text-gray-500">
              UAE-compliant templates for retail, manufacturing, services, and free zones
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-[#E5EAF0] shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(10,58,92,0.10)' }}>
                <Clock className="h-4 w-4" style={{ color: '#0A3A5C' }} />
              </div>
              <h3 className="text-[13px] font-semibold text-gray-900">Rapid Deployment</h3>
            </div>
            <p className="text-[12px] text-gray-500">
              Pre-configured workflows with FTA compliance and automated steps
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-[#E5EAF0] shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(201,162,39,0.12)' }}>
                <Users className="h-4 w-4" style={{ color: '#C9A227' }} />
              </div>
              <h3 className="text-[13px] font-semibold text-gray-900">Peer Reviewed</h3>
            </div>
            <p className="text-[12px] text-gray-500">
              Templates validated by UAE accounting professionals and SME users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
        <TabsList className="bg-gray-100/70 p-1 rounded-xl h-auto">
          <TabsTrigger value="browse" className="rounded-lg text-[13px] data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#0A3A5C] data-[state=active]:font-semibold px-4 py-2">Browse Templates</TabsTrigger>
          <TabsTrigger value="my-templates" className="rounded-lg text-[13px] data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#0A3A5C] data-[state=active]:font-semibold px-4 py-2">My Templates</TabsTrigger>
          <TabsTrigger value="shared" className="rounded-lg text-[13px] data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#0A3A5C] data-[state=active]:font-semibold px-4 py-2">Shared with Me</TabsTrigger>
        </TabsList>

        <TabsContent value="browse">
          <WorkflowTemplateBrowser 
            onSelectTemplate={handleSelectTemplate}
            onShareTemplate={handleShareTemplate}
          />
        </TabsContent>

        <TabsContent value="my-templates">
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <BookTemplate className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No custom templates yet</h3>
            <p className="text-gray-600 mb-6">Create your first custom workflow template</p>
            <Button onClick={handleStartFromScratch} data-testid="button-create-template">
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="shared">
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No shared templates</h3>
            <p className="text-gray-600">Templates shared with you will appear here</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Customizer Dialog */}
      <Dialog open={showCustomizer} onOpenChange={setShowCustomizer}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Customize Workflow Template</DialogTitle>
            <DialogDescription>
              Adapt this template to match your specific business requirements
            </DialogDescription>
          </DialogHeader>
          
          {selectedTemplate && (
            <WorkflowTemplateCustomizer
              template={selectedTemplate}
              onSave={handleSaveCustomTemplate}
              onShare={handleShareTemplate}
              onCancel={() => {
                setShowCustomizer(false);
                setSelectedTemplate(null);
                setIsCreatingNewTemplate(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Sharing Modal */}
      {templateToShare && (
        <WorkflowTemplateSharing
          template={templateToShare}
          isOpen={showSharing}
          onClose={handleCloseSharing}
        />
      )}
    </div>
  );
}