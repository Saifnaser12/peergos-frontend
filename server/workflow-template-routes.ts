import type { Express } from "express";
import { z } from 'zod';
import { INDUSTRY_TEMPLATES, workflowTemplateSchema } from '@shared/workflow-templates';

const queryParamsSchema = z.object({
  search: z.string().optional(),
  industry: z.string().optional(),
  businessType: z.string().optional(),
  complexity: z.string().optional(),
  tags: z.string().optional(),
  limit: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  offset: z.string().optional().transform(val => val ? parseInt(val) : undefined)
});

const createTemplateSchema = workflowTemplateSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  usageCount: true,
  rating: true
});

// In-memory storage for custom templates (in production, use database)
let customTemplates: any[] = [];
let templateUsage: Record<string, { count: number; ratings: number[] }> = {};

export function registerWorkflowTemplateRoutes(app: Express) {
  // Get all workflow templates with filtering
  app.get('/api/workflow-templates', async (req, res) => {
    try {
      const params = queryParamsSchema.parse(req.query);
      
      // Combine industry templates with custom templates
      let allTemplates = [...INDUSTRY_TEMPLATES, ...customTemplates];
      
      // Apply filters
      if (params.search) {
        const searchLower = params.search.toLowerCase();
        allTemplates = allTemplates.filter(template => 
          template.name.toLowerCase().includes(searchLower) ||
          template.description.toLowerCase().includes(searchLower) ||
          template.industry.toLowerCase().includes(searchLower) ||
          template.tags.some((tag: string) => tag.toLowerCase().includes(searchLower))
        );
      }
      
      if (params.industry) {
        allTemplates = allTemplates.filter(template => template.industry === params.industry);
      }
      
      if (params.businessType) {
        allTemplates = allTemplates.filter(template => template.businessType === params.businessType);
      }
      
      if (params.complexity) {
        allTemplates = allTemplates.filter(template => template.complexity === params.complexity);
      }
      
      if (params.tags) {
        const filterTags = params.tags.split(',').map(tag => tag.trim().toLowerCase());
        allTemplates = allTemplates.filter(template =>
          filterTags.some(filterTag =>
            template.tags.some((tag: string) => tag.toLowerCase().includes(filterTag))
          )
        );
      }
      
      // Sort by rating and usage
      allTemplates.sort((a, b) => {
        const aRating = a.rating || 0;
        const bRating = b.rating || 0;
        if (aRating !== bRating) return bRating - aRating;
        return (b.usageCount || 0) - (a.usageCount || 0);
      });
      
      // Apply pagination
      const limit = params.limit || 50;
      const offset = params.offset || 0;
      const paginatedTemplates = allTemplates.slice(offset, offset + limit);
      
      res.json({
        templates: paginatedTemplates,
        total: allTemplates.length,
        limit,
        offset
      });
      
    } catch (error) {
      console.error('Error fetching workflow templates:', error);
      res.status(500).json({ error: 'Failed to fetch workflow templates' });
    }
  });

  // Get specific workflow template
  app.get('/api/workflow-templates/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const template = [...INDUSTRY_TEMPLATES, ...customTemplates]
        .find(t => t.id === id);
      
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      
      res.json(template);
      
    } catch (error) {
      console.error('Error fetching workflow template:', error);
      res.status(500).json({ error: 'Failed to fetch workflow template' });
    }
  });

  // Create custom workflow template
  app.post('/api/workflow-templates', async (req, res) => {
    try {
      const templateData = createTemplateSchema.parse(req.body);
      
      const newTemplate = {
        ...templateData,
        id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0,
        rating: undefined,
        createdBy: 'user' // In production, get from authenticated user
      };
      
      customTemplates.push(newTemplate);
      
      res.status(201).json(newTemplate);
      
    } catch (error) {
      console.error('Error creating workflow template:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid template data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create workflow template' });
    }
  });

  // Update custom workflow template
  app.put('/api/workflow-templates/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const templateIndex = customTemplates.findIndex(t => t.id === id);
      if (templateIndex === -1) {
        return res.status(404).json({ error: 'Template not found or not editable' });
      }
      
      const updatedTemplate = {
        ...customTemplates[templateIndex],
        ...updateData,
        updatedAt: new Date()
      };
      
      // Validate updated template
      workflowTemplateSchema.parse(updatedTemplate);
      
      customTemplates[templateIndex] = updatedTemplate;
      
      res.json(updatedTemplate);
      
    } catch (error) {
      console.error('Error updating workflow template:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid template data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to update workflow template' });
    }
  });

  // Delete custom workflow template
  app.delete('/api/workflow-templates/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const templateIndex = customTemplates.findIndex(t => t.id === id);
      if (templateIndex === -1) {
        return res.status(404).json({ error: 'Template not found or not deletable' });
      }
      
      customTemplates.splice(templateIndex, 1);
      
      res.status(204).send();
      
    } catch (error) {
      console.error('Error deleting workflow template:', error);
      res.status(500).json({ error: 'Failed to delete workflow template' });
    }
  });

  // Track template usage
  app.post('/api/workflow-templates/:id/use', async (req, res) => {
    try {
      const { id } = req.params;
      
      // Update usage count
      if (!templateUsage[id]) {
        templateUsage[id] = { count: 0, ratings: [] };
      }
      templateUsage[id].count++;
      
      // Update template usage count in memory
      const allTemplates = [...INDUSTRY_TEMPLATES, ...customTemplates];
      const template = allTemplates.find(t => t.id === id);
      if (template) {
        template.usageCount = templateUsage[id].count;
      }
      
      res.json({ success: true, usageCount: templateUsage[id].count });
      
    } catch (error) {
      console.error('Error tracking template usage:', error);
      res.status(500).json({ error: 'Failed to track template usage' });
    }
  });

  // Rate workflow template
  app.post('/api/workflow-templates/:id/rate', async (req, res) => {
    try {
      const { id } = req.params;
      const { rating } = req.body;
      
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
      }
      
      // Track rating
      if (!templateUsage[id]) {
        templateUsage[id] = { count: 0, ratings: [] };
      }
      templateUsage[id].ratings.push(rating);
      
      // Calculate average rating
      const averageRating = templateUsage[id].ratings.reduce((sum, r) => sum + r, 0) / templateUsage[id].ratings.length;
      
      // Update template rating
      const allTemplates = [...INDUSTRY_TEMPLATES, ...customTemplates];
      const template = allTemplates.find(t => t.id === id);
      if (template) {
        template.rating = Math.round(averageRating * 10) / 10;
      }
      
      res.json({ success: true, averageRating: template?.rating });
      
    } catch (error) {
      console.error('Error rating template:', error);
      res.status(500).json({ error: 'Failed to rate template' });
    }
  });

  // Get workflow template categories/filters
  app.get('/api/workflow-templates/meta/categories', async (req, res) => {
    try {
      const allTemplates = [...INDUSTRY_TEMPLATES, ...customTemplates];
      
      const industries = [...new Set(allTemplates.map(t => t.industry))].sort();
      const businessTypes = [...new Set(allTemplates.map(t => t.businessType))].sort();
      const complexities = [...new Set(allTemplates.map(t => t.complexity))].sort();
      const allTags = allTemplates.flatMap(t => t.tags);
      const popularTags = [...new Set(allTags)]
        .map(tag => ({ tag, count: allTags.filter(t => t === tag).length }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20)
        .map(item => item.tag);
      
      res.json({
        industries,
        businessTypes,
        complexities,
        popularTags,
        totalTemplates: allTemplates.length
      });
      
    } catch (error) {
      console.error('Error fetching template categories:', error);
      res.status(500).json({ error: 'Failed to fetch template categories' });
    }
  });

  // Share workflow template (generate share link)
  app.post('/api/workflow-templates/:id/share', async (req, res) => {
    try {
      const { id } = req.params;
      const { permissions } = req.body; // 'view' | 'copy' | 'edit'
      
      const template = [...INDUSTRY_TEMPLATES, ...customTemplates]
        .find(t => t.id === id);
      
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      
      // Generate share token (in production, store in database)
      const shareToken = `share-${id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const shareLink = {
        token: shareToken,
        templateId: id,
        permissions: permissions || 'view',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        createdAt: new Date()
      };
      
      res.json({
        shareUrl: `/workflows/shared/${shareToken}`,
        ...shareLink
      });
      
    } catch (error) {
      console.error('Error sharing template:', error);
      res.status(500).json({ error: 'Failed to share template' });
    }
  });
}