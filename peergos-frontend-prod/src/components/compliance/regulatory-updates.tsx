import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  ExternalLink, 
  Calendar, 
  Filter,
  BookOpen,
  AlertTriangle,
  Info,
  CheckCircle2,
  Star
} from 'lucide-react';

interface RegulatoryUpdate {
  id: string;
  title: string;
  description: string;
  source: 'FTA' | 'MOF' | 'DED' | 'ADGM' | 'DIFC';
  category: 'vat' | 'cit' | 'excise' | 'regulatory' | 'policy';
  severity: 'info' | 'important' | 'critical';
  publishDate: Date;
  effectiveDate?: Date;
  deadline?: Date;
  status: 'active' | 'draft' | 'upcoming' | 'implemented';
  impact: 'high' | 'medium' | 'low';
  url?: string;
  summary: string;
  actionRequired: boolean;
}

interface RegulatoryUpdatesProps {
  updates: any[];
}

export function RegulatoryUpdates({ updates }: RegulatoryUpdatesProps) {
  const [filter, setFilter] = useState<'all' | 'critical' | 'actionRequired' | 'recent'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'FTA' | 'MOF' | 'DED'>('all');

  // Generate UAE regulatory updates
  const generateUpdates = (): RegulatoryUpdate[] => {
    return [
      {
        id: 'fta-decision-2025-01',
        title: 'FTA Decision No. 1 of 2025 - E-invoicing Phase 1 Requirements',
        description: 'New requirements for electronic invoicing implementation starting July 2026',
        source: 'FTA',
        category: 'vat',
        severity: 'critical',
        publishDate: new Date('2025-01-15'),
        effectiveDate: new Date('2026-07-01'),
        deadline: new Date('2026-06-30'),
        status: 'active',
        impact: 'high',
        url: 'https://tax.gov.ae/en/e-invoicing',
        summary: 'All VAT-registered businesses must implement UBL 2.1 electronic invoicing through approved service providers.',
        actionRequired: true
      },
      {
        id: 'cabinet-decision-100-2024',
        title: 'Cabinet Decision No. 100 of 2024 - VAT Exemptions Update',
        description: 'New VAT exemptions for fund management and virtual asset services',
        source: 'MOF',
        category: 'vat',
        severity: 'important',
        publishDate: new Date('2024-11-15'),
        effectiveDate: new Date('2024-11-15'),
        status: 'implemented',
        impact: 'medium',
        summary: 'Expanded VAT exemptions for qualified fund management services and virtual asset transfers.',
        actionRequired: false
      },
      {
        id: 'fta-guideline-2025-tp',
        title: 'Transfer Pricing Documentation Guidelines 2025',
        description: 'Updated guidelines for transfer pricing documentation requirements',
        source: 'FTA',
        category: 'cit',
        severity: 'important',
        publishDate: new Date('2025-02-01'),
        effectiveDate: new Date('2025-04-01'),
        deadline: new Date('2025-12-31'),
        status: 'upcoming',
        impact: 'high',
        summary: 'New thresholds and documentation requirements for related party transactions above AED 40M.',
        actionRequired: true
      },
      {
        id: 'excise-decision-6-2025',
        title: 'FTA Decision No. 6 of 2025 - Excise Tax Natural Shortages',
        description: 'New reporting framework for natural shortages in excise goods',
        source: 'FTA',
        category: 'excise',
        severity: 'info',
        publishDate: new Date('2025-01-30'),
        effectiveDate: new Date('2025-07-01'),
        status: 'upcoming',
        impact: 'low',
        summary: 'Pre-approval process required for reporting natural shortages in designated zones.',
        actionRequired: false
      },
      {
        id: 'dmtt-implementation-2025',
        title: 'Domestic Minimum Top-up Tax (DMTT) Implementation',
        description: 'Implementation of 15% DMTT for multinational enterprises',
        source: 'FTA',
        category: 'cit',
        severity: 'critical',
        publishDate: new Date('2024-12-01'),
        effectiveDate: new Date('2025-01-01'),
        deadline: new Date('2025-03-31'),
        status: 'active',
        impact: 'high',
        summary: 'Multinational enterprises with global revenue above €750M must register for DMTT.',
        actionRequired: true
      },
      {
        id: 'natural-persons-ct-2025',
        title: 'Corporate Tax Registration for Natural Persons',
        description: 'Registration requirements for natural persons conducting business',
        source: 'FTA',
        category: 'cit',
        severity: 'critical',
        publishDate: new Date('2024-10-15'),
        effectiveDate: new Date('2025-03-31'),
        deadline: new Date('2025-03-31'),
        status: 'active',
        impact: 'high',
        summary: 'Natural persons with UAE business revenue above AED 1M must register for Corporate Tax.',
        actionRequired: true
      }
    ];
  };

  const allUpdates = generateUpdates();

  const filteredUpdates = allUpdates.filter(update => {
    if (sourceFilter !== 'all' && update.source !== sourceFilter) return false;
    
    switch (filter) {
      case 'critical':
        return update.severity === 'critical';
      case 'actionRequired':
        return update.actionRequired;
      case 'recent':
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return update.publishDate >= thirtyDaysAgo;
      default:
        return true;
    }
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'important':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return AlertTriangle;
      case 'important':
        return Star;
      case 'info':
        return Info;
      default:
        return Bell;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'FTA':
        return 'bg-blue-100 text-blue-800';
      case 'MOF':
        return 'bg-green-100 text-green-800';
      case 'DED':
        return 'bg-purple-100 text-purple-800';
      case 'ADGM':
        return 'bg-yellow-100 text-yellow-800';
      case 'DIFC':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'implemented':
        return CheckCircle2;
      case 'active':
        return AlertTriangle;
      case 'upcoming':
        return Calendar;
      default:
        return Bell;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Regulatory Updates & Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700">Filter by Type:</span>
              {(['all', 'critical', 'actionRequired', 'recent'] as const).map(filterOption => (
                <Button
                  key={filterOption}
                  variant={filter === filterOption ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(filterOption)}
                  className="capitalize"
                >
                  {filterOption === 'actionRequired' ? 'Action Required' : filterOption}
                </Button>
              ))}
            </div>
            
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700">Filter by Source:</span>
              {(['all', 'FTA', 'MOF', 'DED'] as const).map(source => (
                <Button
                  key={source}
                  variant={sourceFilter === source ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSourceFilter(source)}
                >
                  {source}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Updates List */}
      <div className="space-y-4">
        {filteredUpdates.map((update) => {
          const SeverityIcon = getSeverityIcon(update.severity);
          const StatusIcon = getStatusIcon(update.status);

          return (
            <Card key={update.id} className="border-l-4" style={{
              borderLeftColor: 
                update.severity === 'critical' ? '#ef4444' :
                update.severity === 'important' ? '#f59e0b' : '#3b82f6'
            }}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <SeverityIcon className="h-5 w-5 text-gray-600" />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">{update.title}</h3>
                      <p className="text-gray-600 mb-3">{update.description}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="outline" className={getSeverityColor(update.severity)}>
                          {update.severity}
                        </Badge>
                        <Badge variant="outline" className={getSourceColor(update.source)}>
                          {update.source}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {update.category}
                        </Badge>
                        {update.actionRequired && (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            Action Required
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                        {update.summary}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <StatusIcon className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-500 capitalize">{update.status}</span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Published</p>
                      <p className="font-medium">{update.publishDate.toLocaleDateString()}</p>
                    </div>
                    
                    {update.effectiveDate && (
                      <div>
                        <p className="text-gray-500">Effective</p>
                        <p className="font-medium">{update.effectiveDate.toLocaleDateString()}</p>
                      </div>
                    )}
                    
                    {update.deadline && (
                      <div>
                        <p className="text-gray-500">Deadline</p>
                        <p className={`font-medium ${
                          new Date() > update.deadline ? 'text-red-600' : 'text-gray-900'
                        }`}>
                          {update.deadline.toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        update.impact === 'high' ? 'bg-red-100 text-red-700' :
                        update.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {update.impact} impact
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      {update.url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={update.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Read More
                          </a>
                        </Button>
                      )}
                      
                      {update.actionRequired && (
                        <Button size="sm">
                          <BookOpen className="h-3 w-3 mr-1" />
                          Review Requirements
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredUpdates.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No updates found</h3>
            <p className="text-gray-500">
              {filter === 'all' 
                ? 'All regulatory updates are current'
                : `No ${filter} updates at this time`
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}