export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  steps: any[];
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: '1',
    name: 'VAT Filing',
    description: 'Standard VAT filing workflow',
    category: 'tax',
    steps: []
  }
];