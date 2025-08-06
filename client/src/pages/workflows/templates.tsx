import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { WorkflowTemplateBrowser } from '@/components/workflows/workflow-template-browser';
import { WorkflowTemplateCustomizer } from '@/components/workflows/workflow-template-customizer';
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
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [activeTab, setActiveTab] = useState('browse');

  const handleSelectTemplate = (template: WorkflowTemplate) => {
    setSelectedTemplate(template);
    setShowCustomizer(true);
  };

  const handleSaveCustomTemplate = (customizedTemplate: WorkflowTemplate) => {
    // In a real app, save to backend
    console.log('Saving customized template:', customizedTemplate);
    setShowCustomizer(false);
    setSelectedTemplate(null);
    // Show success message or redirect
  };

  const handleStartFromScratch = () => {
    // Create a blank template
    const blankTemplate: WorkflowTemplate = {
      id: `custom-${Date.now()}`,
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
    setShowCustomizer(true);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BookTemplate className="h-8 w-8 text-blue-600" />
            Workflow Templates
          </h1>
          <p className="text-lg text-gray-600 mt-2">
            Get started quickly with industry-specific workflow templates designed for UAE businesses
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleStartFromScratch}>
            <Plus className="h-4 w-4 mr-2" />
            Start from Scratch
          </Button>
          <Button>
            <Sparkles className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>
      </div>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-blue-100 rounded-full p-2">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Industry Specific</h3>
            </div>
            <p className="text-sm text-gray-600">
              Templates tailored for retail, manufacturing, professional services, and more
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-green-100 rounded-full p-2">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Quick Setup</h3>
            </div>
            <p className="text-sm text-gray-600">
              Get up and running in minutes with pre-configured workflows
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-purple-100 rounded-full p-2">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Community Driven</h3>
            </div>
            <p className="text-sm text-gray-600">
              Templates created and refined by the business community
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="browse">Browse Templates</TabsTrigger>
          <TabsTrigger value="my-templates">My Templates</TabsTrigger>
          <TabsTrigger value="shared">Shared with Me</TabsTrigger>
        </TabsList>

        <TabsContent value="browse">
          <WorkflowTemplateBrowser onSelectTemplate={handleSelectTemplate} />
        </TabsContent>

        <TabsContent value="my-templates">
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <BookTemplate className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No custom templates yet</h3>
            <p className="text-gray-600 mb-6">Create your first custom workflow template</p>
            <Button onClick={handleStartFromScratch}>
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
              onCancel={() => setShowCustomizer(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}