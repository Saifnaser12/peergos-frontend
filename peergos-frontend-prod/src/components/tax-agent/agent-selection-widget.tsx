import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserCheck, AlertTriangle, Phone, Mail, Calendar, Search } from 'lucide-react';
import { TaxAgent, getAgentById, getAgentStatusBadge, getComplianceWarnings } from '@/lib/tax-agents';
import AgentDirectoryModal from './agent-directory-modal';
import { useLanguage } from '@/context/language-context';
import { cn } from '@/lib/utils';

interface AgentSelectionWidgetProps {
  selectedAgentId?: string;
  onAgentSelected: (agent: TaxAgent) => void;
  onAgentRemoved: () => void;
  filterBySpecialty?: string;
  showComplianceWarnings?: boolean;
  className?: string;
}

export default function AgentSelectionWidget({
  selectedAgentId,
  onAgentSelected,
  onAgentRemoved,
  filterBySpecialty,
  showComplianceWarnings = true,
  className = ''
}: AgentSelectionWidgetProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { language } = useLanguage();

  const selectedAgent = selectedAgentId ? getAgentById(selectedAgentId) : undefined;
  const warnings = showComplianceWarnings ? getComplianceWarnings(selectedAgent) : [];

  const handleSelectAgent = (agent: TaxAgent) => {
    onAgentSelected(agent);
    setIsModalOpen(false);
  };

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-blue-600" />
            {language === 'ar' ? 'وكيل الضرائب' : 'Tax Agent'}
            {filterBySpecialty && (
              <Badge variant="outline" className="text-xs">
                {filterBySpecialty}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {!selectedAgent ? (
            // No agent selected state
            <div className="text-center py-6">
              <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <UserCheck className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">
                {language === 'ar' ? 'لم يتم اختيار وكيل ضرائب' : 'No Tax Agent Selected'}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {language === 'ar' 
                  ? 'اختر وكيل ضرائب معتمد من الهيئة الاتحادية للضرائب لمساعدتك في التقديم'
                  : 'Select an FTA-approved tax agent to assist with your filing'
                }
              </p>
              <Button onClick={() => setIsModalOpen(true)} className="w-full">
                <Search className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'اختر وكيل ضرائب' : 'Select Tax Agent'}
              </Button>
            </div>
          ) : (
            // Agent selected state
            <div className="space-y-4">
              {/* Agent Info Card */}
              <div className="border rounded-lg p-4 bg-blue-50/30">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedAgent.name}</h3>
                    <p className="text-sm text-gray-600 font-mono">{selectedAgent.taxAgentNumber}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const statusBadge = getAgentStatusBadge(selectedAgent);
                      return (
                        <Badge className={statusBadge.color}>
                          {statusBadge.icon} {statusBadge.label}
                        </Badge>
                      );
                    })()}
                  </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone size={14} />
                    <span>{selectedAgent.contactInfo.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail size={14} />
                    <span>{selectedAgent.contactInfo.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar size={14} />
                    <span>
                      {language === 'ar' ? 'تنتهي الشهادة:' : 'Cert. expires:'} {' '}
                      {new Date(selectedAgent.ftaCertificationExpiry).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Specialties */}
                <div className="mt-3">
                  <div className="flex flex-wrap gap-1">
                    {selectedAgent.specialties.map(specialty => (
                      <Badge key={specialty} variant="outline" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsModalOpen(true)}
                  className="flex-1"
                >
                  {language === 'ar' ? 'تغيير الوكيل' : 'Change Agent'}
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={onAgentRemoved}
                  className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  {language === 'ar' ? 'إزالة الوكيل' : 'Remove Agent'}
                </Button>
              </div>
            </div>
          )}

          {/* Compliance Warnings */}
          {warnings.length > 0 && (
            <div className="space-y-2">
              {warnings.map((warning, index) => (
                <Alert key={index} className="border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800 text-sm">
                    {warning}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {/* Information Note */}
          {!selectedAgent && (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm">
                {language === 'ar'
                  ? 'وفقاً للمادة 10 من قانون الإجراءات الضريبية الإماراتي، قد تتطلب الإقرارات المعقدة مساعدة مهنية.'
                  : 'As per Article 10 of the UAE Tax Procedures Law, complex returns may require professional assistance.'
                }
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Agent Directory Modal */}
      <AgentDirectoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectAgent={handleSelectAgent}
        selectedAgentId={selectedAgentId}
        filterBySpecialty={filterBySpecialty}
      />
    </>
  );
}