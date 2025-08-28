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
import type { WorkflowTemplate } from '../../shared/workflow-templates';

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
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-3">
            <BookTemplate className="h-6 w-6 text-emerald-600" />
            Workflow Templates
          </h1>
          <p className="text-gray-600 mt-1">
            Industry-specific templates to accelerate your UAE business compliance setup
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleStartFromScratch} className="h-9 px-3">
            <Plus className="h-4 w-4 mr-2" />
            Custom Workflow
          </Button>
          <Button className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700">
            <Sparkles className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-emerald-100 rounded-lg p-2">
                <Target className="h-4 w-4 text-emerald-600" />
              </div>
              <h3 className="font-medium text-gray-900">Industry Specific</h3>
            </div>
            <p className="text-sm text-gray-600">
              UAE-compliant templates for retail, manufacturing, services, and free zones
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-100 rounded-lg p-2">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-900">Rapid Deployment</h3>
            </div>
            <p className="text-sm text-gray-600">
              Pre-configured workflows with FTA compliance and automated steps
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-amber-100 rounded-lg p-2">
                <Users className="h-4 w-4 text-amber-600" />
              </div>
              <h3 className="font-medium text-gray-900">Peer Reviewed</h3>
            </div>
            <p className="text-sm text-gray-600">
              Templates validated by UAE accounting professionals and SME users
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