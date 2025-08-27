import { useState, useMemo } from 'react';
import { X, Search, Filter, Star, Phone, Mail, MapPin, Calendar, Badge as BadgeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TaxAgent, 
  FTA_APPROVED_AGENTS, 
  UAE_EMIRATES, 
  TAX_SPECIALTIES,
  getAgentStatusBadge,
  isAgentCertificationExpiring,
  isAgentCertificationExpired 
} from '@/lib/tax-agents';
import { useLanguage } from '@/context/language-context';
import { cn } from '@/lib/utils';

interface AgentDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAgent: (agent: TaxAgent) => void;
  selectedAgentId?: string;
  filterBySpecialty?: string;
}

export default function AgentDirectoryModal({
  isOpen,
  onClose,
  onSelectAgent,
  selectedAgentId,
  filterBySpecialty
}: AgentDirectoryModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEmirate, setFilterEmirate] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState(filterBySpecialty || '');
  const [sortBy, setSortBy] = useState<'rating' | 'cases' | 'name'>('rating');
  
  const { language } = useLanguage();

  const filteredAndSortedAgents = useMemo(() => {
    let filtered = FTA_APPROVED_AGENTS.filter(agent => {
      const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           agent.taxAgentNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesEmirate = !filterEmirate || agent.emirate === filterEmirate;
      const matchesSpecialty = !filterSpecialty || agent.specialties.includes(filterSpecialty as any);
      
      return matchesSearch && matchesEmirate && matchesSpecialty;
    });

    // Sort agents
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'cases':
          return b.casesHandled - a.casesHandled;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchTerm, filterEmirate, filterSpecialty, sortBy]);

  const handleSelectAgent = (agent: TaxAgent) => {
    onSelectAgent(agent);
    onClose();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterEmirate('');
    setFilterSpecialty(filterBySpecialty || '');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <Card className="relative w-full max-w-6xl h-[80vh] mx-4 shadow-2xl">
        {/* Header */}
        <div className="border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">FTA-Approved Tax Agents</h2>
              <p className="text-blue-100 mt-1">
                Select a certified tax agent for your filing requirements
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X size={20} />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="border-b p-4 bg-gray-50">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-64 relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by name or tax agent number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Emirate Filter */}
            <Select value={filterEmirate} onValueChange={setFilterEmirate}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Emirates" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Emirates</SelectItem>
                {UAE_EMIRATES.map(emirate => (
                  <SelectItem key={emirate} value={emirate}>
                    {emirate}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Specialty Filter */}
            <Select value={filterSpecialty} onValueChange={setFilterSpecialty}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Specialties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Specialties</SelectItem>
                {TAX_SPECIALTIES.map(specialty => (
                  <SelectItem key={specialty.value} value={specialty.value}>
                    {specialty.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">By Rating</SelectItem>
                <SelectItem value="cases">By Experience</SelectItem>
                <SelectItem value="name">By Name</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            <Button variant="outline" onClick={clearFilters}>
              Clear
            </Button>
          </div>
        </div>

        {/* Results */}
        <CardContent className="p-0 flex-1">
          <ScrollArea className="h-full">
            {filteredAndSortedAgents.length === 0 ? (
              <div className="text-center py-12">
                <Filter size={48} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No agents found</h3>
                <p className="text-gray-500">Try adjusting your search criteria</p>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {filteredAndSortedAgents.map((agent) => {
                  const statusBadge = getAgentStatusBadge(agent);
                  const isSelected = agent.id === selectedAgentId;
                  const isExpiring = isAgentCertificationExpiring(agent);
                  const isExpired = isAgentCertificationExpired(agent);

                  return (
                    <Card 
                      key={agent.id}
                      className={cn(
                        "border cursor-pointer transition-all hover:shadow-md",
                        isSelected && "ring-2 ring-blue-500 border-blue-500",
                        isExpired && "border-red-200 bg-red-50/30"
                      )}
                      onClick={() => handleSelectAgent(agent)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            {/* Header */}
                            <div className="flex items-start gap-4 mb-4">
                              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <BadgeIcon size={24} className="text-blue-600" />
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="text-lg font-semibold text-gray-900">{agent.name}</h3>
                                  {isSelected && (
                                    <Badge className="bg-blue-100 text-blue-800">Selected</Badge>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                                  <span className="font-mono">{agent.taxAgentNumber}</span>
                                  <span className="flex items-center gap-1">
                                    <MapPin size={14} />
                                    {agent.emirate}
                                  </span>
                                </div>

                                {/* Status and Rating */}
                                <div className="flex items-center gap-3">
                                  <Badge className={statusBadge.color}>
                                    {statusBadge.icon} {statusBadge.label}
                                  </Badge>
                                  
                                  <div className="flex items-center gap-1">
                                    <Star size={14} className="fill-yellow-400 text-yellow-400" />
                                    <span className="text-sm font-medium">{agent.rating}</span>
                                    <span className="text-sm text-gray-500">({agent.casesHandled} cases)</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Specialties */}
                            <div className="mb-4">
                              <div className="flex flex-wrap gap-2">
                                {agent.specialties.map(specialty => (
                                  <Badge key={specialty} variant="outline" className="text-xs">
                                    {TAX_SPECIALTIES.find(s => s.value === specialty)?.label || specialty}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            {/* Contact Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div className="flex items-center gap-2 text-gray-600">
                                <Phone size={14} />
                                <span>{agent.contactInfo.phone}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <Mail size={14} />
                                <span>{agent.contactInfo.email}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <Calendar size={14} />
                                <span>Cert. expires: {new Date(agent.ftaCertificationExpiry).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <span>Languages: {agent.languages.join(', ')}</span>
                              </div>
                            </div>

                            {/* Address */}
                            <p className="text-sm text-gray-600 mt-2">{agent.contactInfo.address}</p>

                            {/* Warnings */}
                            {(isExpired || isExpiring) && (
                              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-sm text-yellow-800">
                                  {isExpired 
                                    ? '⚠️ This agent\'s FTA certification has expired. Verify current status before selection.'
                                    : '⏰ This agent\'s FTA certification expires soon. Confirm renewal status.'
                                  }
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {filteredAndSortedAgents.length} of {FTA_APPROVED_AGENTS.length} FTA-approved agents
            </span>
            <span className="text-xs">
              Data last updated: {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}