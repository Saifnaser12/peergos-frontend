import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Plus, 
  Minus, 
  Move,
  Clock,
  AlertCircle,
  CheckCircle2,
  Save,
  Eye,
  Share2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorkflowTemplate, WorkflowStep } from '@shared/workflow-templates';

interface WorkflowTemplateCustomizerProps {
  template: WorkflowTemplate;
  onSave: (customizedTemplate: WorkflowTemplate) => void;
  onCancel: () => void;
}

export function WorkflowTemplateCustomizer({ template, onSave, onCancel }: WorkflowTemplateCustomizerProps) {
  const [customTemplate, setCustomTemplate] = useState<WorkflowTemplate>(template);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);

  const updateTemplate = (field: keyof WorkflowTemplate, value: any) => {
    setCustomTemplate(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateStep = (stepId: string, field: keyof WorkflowStep, value: any) => {
    setCustomTemplate(prev => ({
      ...prev,
      steps: prev.steps.map(step => 
        step.id === stepId ? { ...step, [field]: value } : step
      )
    }));
  };

  const addStep = () => {
    const newStep: WorkflowStep = {
      id: `custom-step-${Date.now()}`,
      title: 'New Step',
      description: 'Custom workflow step',
      estimatedTime: '1 hour',
      dependencies: [],
      category: 'SETUP',
      priority: 'MEDIUM',
      automated: false,
      resources: []
    };

    setCustomTemplate(prev => ({
      ...prev,
      steps: [...prev.steps, newStep]
    }));
  };

  const removeStep = (stepId: string) => {
    setCustomTemplate(prev => ({
      ...prev,
      steps: prev.steps.filter(step => step.id !== stepId)
    }));
  };

  const moveStep = (stepId: string, direction: 'up' | 'down') => {
    setCustomTemplate(prev => {
      const steps = [...prev.steps];
      const index = steps.findIndex(step => step.id === stepId);
      
      if (direction === 'up' && index > 0) {
        [steps[index], steps[index - 1]] = [steps[index - 1], steps[index]];
      } else if (direction === 'down' && index < steps.length - 1) {
        [steps[index], steps[index + 1]] = [steps[index + 1], steps[index]];
      }
      
      return { ...prev, steps };
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'text-gray-600';
      case 'MEDIUM': return 'text-yellow-600';
      case 'HIGH': return 'text-orange-600';
      case 'CRITICAL': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'SETUP': return 'bg-blue-100 text-blue-800';
      case 'COMPLIANCE': return 'bg-red-100 text-red-800';
      case 'ACCOUNTING': return 'bg-green-100 text-green-800';
      case 'TAX': return 'bg-yellow-100 text-yellow-800';
      case 'REPORTING': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Customize Workflow Template</h2>
          <p className="text-gray-600">Adapt this template to match your specific business needs</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => onSave(customTemplate)}>
            <Save className="h-4 w-4 mr-2" />
            Save Template
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General Info</TabsTrigger>
          <TabsTrigger value="steps">Workflow Steps</TabsTrigger>
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Template Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    value={customTemplate.name}
                    onChange={(e) => updateTemplate('name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimated-duration">Estimated Duration</Label>
                  <Input
                    id="estimated-duration"
                    value={customTemplate.estimatedDuration}
                    onChange={(e) => updateTemplate('estimatedDuration', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={customTemplate.description}
                  onChange={(e) => updateTemplate('description', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Select value={customTemplate.industry} onValueChange={(value) => updateTemplate('industry', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Retail">Retail</SelectItem>
                      <SelectItem value="Professional Services">Professional Services</SelectItem>
                      <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Healthcare">Healthcare</SelectItem>
                      <SelectItem value="Construction">Construction</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Business Type</Label>
                  <Select value={customTemplate.businessType} onValueChange={(value) => updateTemplate('businessType', value as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SME">SME</SelectItem>
                      <SelectItem value="FREELANCER">Freelancer</SelectItem>
                      <SelectItem value="STARTUP">Startup</SelectItem>
                      <SelectItem value="ESTABLISHED">Established</SelectItem>
                      <SelectItem value="FREEZONE">Free Zone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Complexity</Label>
                  <Select value={customTemplate.complexity} onValueChange={(value) => updateTemplate('complexity', value as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BASIC">Basic</SelectItem>
                      <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                      <SelectItem value="ADVANCED">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <Input
                  value={customTemplate.tags.join(', ')}
                  onChange={(e) => updateTemplate('tags', e.target.value.split(', ').filter(Boolean))}
                  placeholder="Enter tags separated by commas"
                />
                <div className="flex flex-wrap gap-1 mt-2">
                  {customTemplate.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="steps" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Workflow Steps ({customTemplate.steps.length})</h3>
            <Button onClick={addStep} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Step
            </Button>
          </div>

          <div className="space-y-3">
            {customTemplate.steps.map((step, index) => (
              <Card key={step.id} className={cn(
                "transition-colors",
                activeStepId === step.id && "ring-2 ring-blue-500"
              )}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium text-gray-500">#{index + 1}</div>
                      <Badge variant="secondary" className={getCategoryColor(step.category)}>
                        {step.category}
                      </Badge>
                      <Badge variant="outline" className={getPriorityColor(step.priority)}>
                        {step.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveStep(step.id, 'up')}
                        disabled={index === 0}
                      >
                        <Move className="h-3 w-3 rotate-180" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveStep(step.id, 'down')}
                        disabled={index === customTemplate.steps.length - 1}
                      >
                        <Move className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveStepId(activeStepId === step.id ? null : step.id)}
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStep(step.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {activeStepId === step.id ? (
                    <div className="space-y-3 border-t pt-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Title</Label>
                          <Input
                            value={step.title}
                            onChange={(e) => updateStep(step.id, 'title', e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Estimated Time</Label>
                          <Input
                            value={step.estimatedTime}
                            onChange={(e) => updateStep(step.id, 'estimatedTime', e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-xs">Description</Label>
                        <Textarea
                          value={step.description}
                          onChange={(e) => updateStep(step.id, 'description', e.target.value)}
                          className="text-sm"
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Category</Label>
                          <Select value={step.category} onValueChange={(value) => updateStep(step.id, 'category', value as any)}>
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SETUP">Setup</SelectItem>
                              <SelectItem value="COMPLIANCE">Compliance</SelectItem>
                              <SelectItem value="ACCOUNTING">Accounting</SelectItem>
                              <SelectItem value="TAX">Tax</SelectItem>
                              <SelectItem value="REPORTING">Reporting</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Priority</Label>
                          <Select value={step.priority} onValueChange={(value) => updateStep(step.id, 'priority', value as any)}>
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="LOW">Low</SelectItem>
                              <SelectItem value="MEDIUM">Medium</SelectItem>
                              <SelectItem value="HIGH">High</SelectItem>
                              <SelectItem value="CRITICAL">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`automated-${step.id}`}
                          checked={step.automated}
                          onCheckedChange={(checked) => updateStep(step.id, 'automated', checked)}
                        />
                        <Label htmlFor={`automated-${step.id}`} className="text-xs">
                          Automated Step
                        </Label>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">{step.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {step.estimatedTime}
                        </div>
                        {step.automated && (
                          <div className="flex items-center gap-1 text-blue-600">
                            <CheckCircle2 className="h-3 w-3" />
                            Automated
                          </div>
                        )}
                        {step.dependencies.length > 0 && (
                          <div className="flex items-center gap-1 text-orange-600">
                            <AlertCircle className="h-3 w-3" />
                            {step.dependencies.length} dependencies
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="requirements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Requirements & Outcomes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Requirements</Label>
                <p className="text-sm text-gray-500 mb-2">What your business needs before starting this workflow</p>
                <Textarea
                  value={customTemplate.requirements.join('\n')}
                  onChange={(e) => updateTemplate('requirements', e.target.value.split('\n').filter(Boolean))}
                  rows={4}
                  placeholder="Enter each requirement on a new line"
                />
              </div>

              <div>
                <Label>Expected Outcomes</Label>
                <p className="text-sm text-gray-500 mb-2">What you'll achieve by completing this workflow</p>
                <Textarea
                  value={customTemplate.outcomes.join('\n')}
                  onChange={(e) => updateTemplate('outcomes', e.target.value.split('\n').filter(Boolean))}
                  rows={4}
                  placeholder="Enter each outcome on a new line"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Template Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Make Template Public</Label>
                  <p className="text-sm text-gray-500">Allow other users to discover and use this template</p>
                </div>
                <Switch
                  checked={customTemplate.isPublic}
                  onCheckedChange={(checked) => updateTemplate('isPublic', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label>Template ID</Label>
                <Input
                  value={customTemplate.id}
                  onChange={(e) => updateTemplate('id', e.target.value)}
                  placeholder="unique-template-id"
                />
                <p className="text-sm text-gray-500">Used for sharing and referencing this template</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}