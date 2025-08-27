import { z } from 'zod';

// Workflow Template Schema
export const workflowTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  industry: z.string(),
  businessType: z.enum(['SME', 'FREELANCER', 'STARTUP', 'ESTABLISHED', 'FREEZONE']),
  complexity: z.enum(['BASIC', 'INTERMEDIATE', 'ADVANCED']),
  estimatedDuration: z.string(), // e.g., "2-3 hours", "1 week"
  steps: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    estimatedTime: z.string(),
    dependencies: z.array(z.string()),
    category: z.enum(['SETUP', 'COMPLIANCE', 'ACCOUNTING', 'TAX', 'REPORTING']),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    automated: z.boolean(),
    resources: z.array(z.object({
      type: z.enum(['DOCUMENT', 'TEMPLATE', 'GUIDE', 'VIDEO']),
      title: z.string(),
      url: z.string().optional(),
      content: z.string().optional()
    }))
  })),
  requirements: z.array(z.string()),
  outcomes: z.array(z.string()),
  isPublic: z.boolean(),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  tags: z.array(z.string()),
  rating: z.number().min(0).max(5).optional(),
  usageCount: z.number().default(0)
});

export type WorkflowTemplate = z.infer<typeof workflowTemplateSchema>;
export type WorkflowStep = WorkflowTemplate['steps'][0];

// Pre-defined Industry Templates
export const INDUSTRY_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'retail-sme-setup',
    name: 'Retail Business Setup & Compliance',
    description: 'Complete setup workflow for retail businesses in UAE including VAT registration, inventory management, and e-invoicing compliance',
    industry: 'Retail',
    businessType: 'SME',
    complexity: 'INTERMEDIATE',
    estimatedDuration: '3-5 days',
    requirements: [
      'Trade License',
      'Emirates ID',
      'Bank Account Details',
      'Business Location Details'
    ],
    outcomes: [
      'VAT Registration Complete',
      'E-invoicing System Active',
      'Inventory Tracking Setup',
      'Financial Reporting Ready'
    ],
    steps: [
      {
        id: 'company-registration',
        title: 'Company Registration & Setup',
        description: 'Register company details and obtain necessary documentation',
        estimatedTime: '1-2 hours',
        dependencies: [],
        category: 'SETUP',
        priority: 'CRITICAL',
        automated: false,
        resources: [
          {
            type: 'GUIDE',
            title: 'Company Registration Checklist',
            content: 'Complete guide for registering retail business in UAE'
          }
        ]
      },
      {
        id: 'vat-registration',
        title: 'VAT Registration',
        description: 'Register for VAT with FTA and obtain VAT number',
        estimatedTime: '2-3 hours',
        dependencies: ['company-registration'],
        category: 'COMPLIANCE',
        priority: 'HIGH',
        automated: true,
        resources: [
          {
            type: 'TEMPLATE',
            title: 'VAT Registration Form',
            content: 'Pre-filled VAT registration template'
          }
        ]
      },
      {
        id: 'chart-of-accounts',
        title: 'Setup Chart of Accounts',
        description: 'Configure retail-specific chart of accounts with UAE compliance',
        estimatedTime: '1 hour',
        dependencies: ['company-registration'],
        category: 'ACCOUNTING',
        priority: 'HIGH',
        automated: true,
        resources: [
          {
            type: 'TEMPLATE',
            title: 'Retail Chart of Accounts',
            content: 'UAE-compliant chart of accounts for retail businesses'
          }
        ]
      },
      {
        id: 'inventory-setup',
        title: 'Inventory Management Setup',
        description: 'Configure inventory tracking and valuation methods',
        estimatedTime: '2-3 hours',
        dependencies: ['chart-of-accounts'],
        category: 'ACCOUNTING',
        priority: 'MEDIUM',
        automated: false,
        resources: [
          {
            type: 'GUIDE',
            title: 'Inventory Management Best Practices',
            content: 'Guide for setting up inventory systems in UAE'
          }
        ]
      },
      {
        id: 'e-invoicing-setup',
        title: 'E-invoicing Implementation',
        description: 'Setup e-invoicing system compliant with UAE FTA Phase 2',
        estimatedTime: '1-2 hours',
        dependencies: ['vat-registration'],
        category: 'COMPLIANCE',
        priority: 'CRITICAL',
        automated: true,
        resources: [
          {
            type: 'TEMPLATE',
            title: 'E-invoice Template',
            content: 'FTA-compliant e-invoice template'
          }
        ]
      }
    ],
    isPublic: true,
    createdBy: 'system',
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ['retail', 'vat', 'e-invoicing', 'inventory'],
    rating: 4.8,
    usageCount: 156
  },
  {
    id: 'consulting-freelancer-setup',
    name: 'Consulting & Professional Services Setup',
    description: 'Streamlined setup for consulting and professional service providers',
    industry: 'Professional Services',
    businessType: 'FREELANCER',
    complexity: 'BASIC',
    estimatedDuration: '1-2 days',
    requirements: [
      'Professional License',
      'Emirates ID',
      'Bank Account Details'
    ],
    outcomes: [
      'Business Registration Complete',
      'Tax Compliance Setup',
      'Invoice Management Ready',
      'Client Management System'
    ],
    steps: [
      {
        id: 'freelancer-registration',
        title: 'Freelancer License Setup',
        description: 'Register as freelancer and setup business profile',
        estimatedTime: '1 hour',
        dependencies: [],
        category: 'SETUP',
        priority: 'CRITICAL',
        automated: false,
        resources: [
          {
            type: 'GUIDE',
            title: 'Freelancer Registration Guide',
            content: 'Step-by-step guide for freelancer registration in UAE'
          }
        ]
      },
      {
        id: 'service-categorization',
        title: 'Service Categorization',
        description: 'Define and categorize professional services for tax purposes',
        estimatedTime: '30 minutes',
        dependencies: ['freelancer-registration'],
        category: 'SETUP',
        priority: 'HIGH',
        automated: true,
        resources: [
          {
            type: 'TEMPLATE',
            title: 'Service Categories Template',
            content: 'Pre-defined service categories for tax classification'
          }
        ]
      },
      {
        id: 'basic-accounting-setup',
        title: 'Basic Accounting Setup',
        description: 'Setup simplified accounting for service-based business',
        estimatedTime: '1 hour',
        dependencies: ['service-categorization'],
        category: 'ACCOUNTING',
        priority: 'HIGH',
        automated: true,
        resources: [
          {
            type: 'TEMPLATE',
            title: 'Service Business Chart of Accounts',
            content: 'Simplified chart of accounts for service businesses'
          }
        ]
      },
      {
        id: 'invoice-templates',
        title: 'Invoice Template Setup',
        description: 'Create professional invoice templates with UAE compliance',
        estimatedTime: '45 minutes',
        dependencies: ['basic-accounting-setup'],
        category: 'SETUP',
        priority: 'MEDIUM',
        automated: true,
        resources: [
          {
            type: 'TEMPLATE',
            title: 'Professional Service Invoice',
            content: 'UAE-compliant invoice template for services'
          }
        ]
      }
    ],
    isPublic: true,
    createdBy: 'system',
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ['consulting', 'freelancer', 'services', 'simple-setup'],
    rating: 4.6,
    usageCount: 89
  },
  {
    id: 'manufacturing-sme-setup',
    name: 'Manufacturing Business Complete Setup',
    description: 'Comprehensive setup for manufacturing businesses including production tracking, quality control, and export documentation',
    industry: 'Manufacturing',
    businessType: 'SME',
    complexity: 'ADVANCED',
    estimatedDuration: '1-2 weeks',
    requirements: [
      'Manufacturing License',
      'Environmental Permits',
      'Quality Certifications',
      'Export License (if applicable)'
    ],
    outcomes: [
      'Production System Setup',
      'Quality Control Processes',
      'Export Documentation Ready',
      'Cost Accounting System',
      'Regulatory Compliance'
    ],
    steps: [
      {
        id: 'manufacturing-registration',
        title: 'Manufacturing Business Registration',
        description: 'Complete business registration with manufacturing-specific requirements',
        estimatedTime: '4-6 hours',
        dependencies: [],
        category: 'SETUP',
        priority: 'CRITICAL',
        automated: false,
        resources: [
          {
            type: 'GUIDE',
            title: 'Manufacturing Business Registration',
            content: 'Complete guide for manufacturing business setup in UAE'
          }
        ]
      },
      {
        id: 'production-costing-setup',
        title: 'Production Cost Accounting',
        description: 'Setup cost accounting system for manufacturing operations',
        estimatedTime: '3-4 hours',
        dependencies: ['manufacturing-registration'],
        category: 'ACCOUNTING',
        priority: 'HIGH',
        automated: true,
        resources: [
          {
            type: 'TEMPLATE',
            title: 'Manufacturing Cost Centers',
            content: 'Cost center templates for manufacturing businesses'
          }
        ]
      },
      {
        id: 'inventory-raw-materials',
        title: 'Raw Materials & Inventory Management',
        description: 'Setup comprehensive inventory system for raw materials, WIP, and finished goods',
        estimatedTime: '4-5 hours',
        dependencies: ['production-costing-setup'],
        category: 'ACCOUNTING',
        priority: 'HIGH',
        automated: false,
        resources: [
          {
            type: 'GUIDE',
            title: 'Manufacturing Inventory Management',
            content: 'Best practices for manufacturing inventory control'
          }
        ]
      },
      {
        id: 'export-documentation',
        title: 'Export Documentation Setup',
        description: 'Setup export documentation and compliance procedures',
        estimatedTime: '2-3 hours',
        dependencies: ['inventory-raw-materials'],
        category: 'COMPLIANCE',
        priority: 'MEDIUM',
        automated: true,
        resources: [
          {
            type: 'TEMPLATE',
            title: 'Export Documentation Templates',
            content: 'Standard export documentation templates'
          }
        ]
      }
    ],
    isPublic: true,
    createdBy: 'system',
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ['manufacturing', 'production', 'export', 'cost-accounting'],
    rating: 4.9,
    usageCount: 34
  },
  {
    id: 'freezone-tech-startup',
    name: 'Free Zone Tech Startup Setup',
    description: 'Specialized workflow for technology startups in UAE Free Zones',
    industry: 'Technology',
    businessType: 'FREEZONE',
    complexity: 'INTERMEDIATE',
    estimatedDuration: '2-3 days',
    requirements: [
      'Free Zone License',
      'Investor Visa',
      'Office Space Agreement',
      'Technology Description'
    ],
    outcomes: [
      'Free Zone Compliance Setup',
      'IP Protection Ready',
      'Investor Reporting System',
      'Payroll Management',
      'International Tax Planning'
    ],
    steps: [
      {
        id: 'freezone-registration',
        title: 'Free Zone Company Setup',
        description: 'Complete free zone company registration and licensing',
        estimatedTime: '2-3 hours',
        dependencies: [],
        category: 'SETUP',
        priority: 'CRITICAL',
        automated: false,
        resources: [
          {
            type: 'GUIDE',
            title: 'Free Zone Registration Guide',
            content: 'Complete guide for free zone company setup'
          }
        ]
      },
      {
        id: 'ip-asset-management',
        title: 'IP Asset Management Setup',
        description: 'Setup intellectual property asset tracking and valuation',
        estimatedTime: '2 hours',
        dependencies: ['freezone-registration'],
        category: 'ACCOUNTING',
        priority: 'HIGH',
        automated: true,
        resources: [
          {
            type: 'TEMPLATE',
            title: 'IP Asset Register',
            content: 'Template for tracking intellectual property assets'
          }
        ]
      },
      {
        id: 'investor-reporting',
        title: 'Investor Reporting System',
        description: 'Setup automated investor reporting and dashboard',
        estimatedTime: '1-2 hours',
        dependencies: ['ip-asset-management'],
        category: 'REPORTING',
        priority: 'MEDIUM',
        automated: true,
        resources: [
          {
            type: 'TEMPLATE',
            title: 'Investor Report Template',
            content: 'Professional investor reporting template'
          }
        ]
      },
      {
        id: 'payroll-equity-management',
        title: 'Payroll & Equity Management',
        description: 'Setup payroll system with equity compensation tracking',
        estimatedTime: '2-3 hours',
        dependencies: ['investor-reporting'],
        category: 'ACCOUNTING',
        priority: 'HIGH',
        automated: true,
        resources: [
          {
            type: 'TEMPLATE',
            title: 'Equity Compensation Tracker',
            content: 'Template for tracking employee equity compensation'
          }
        ]
      }
    ],
    isPublic: true,
    createdBy: 'system',
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ['freezone', 'startup', 'technology', 'ip', 'equity'],
    rating: 4.7,
    usageCount: 67
  }
];

// Workflow Customization Options
export const customizationOptions = {
  businessTypes: [
    { value: 'SME', label: 'Small & Medium Enterprise', description: 'Traditional SME businesses' },
    { value: 'FREELANCER', label: 'Freelancer', description: 'Individual professional services' },
    { value: 'STARTUP', label: 'Startup', description: 'Early-stage innovative businesses' },
    { value: 'ESTABLISHED', label: 'Established Business', description: 'Mature businesses with complex needs' },
    { value: 'FREEZONE', label: 'Free Zone', description: 'Free zone registered entities' }
  ],
  industries: [
    'Retail',
    'Professional Services',
    'Manufacturing',
    'Technology',
    'Healthcare',
    'Education',
    'Real Estate',
    'Construction',
    'Food & Beverage',
    'Transportation',
    'Finance',
    'Tourism'
  ],
  complexityLevels: [
    { value: 'BASIC', label: 'Basic', description: 'Simple setup with minimal requirements' },
    { value: 'INTERMEDIATE', label: 'Intermediate', description: 'Standard business setup' },
    { value: 'ADVANCED', label: 'Advanced', description: 'Complex multi-entity setup' }
  ]
};