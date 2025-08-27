export interface TaxAgent {
  id: string;
  name: string;
  taxAgentNumber: string;
  emirate: string;
  contactInfo: {
    email: string;
    phone: string;
    address: string;
  };
  ftaCertificationExpiry: string;
  specialties: ('CIT' | 'VAT' | 'FREE_ZONE' | 'TRANSFER_PRICING' | 'CUSTOMS')[];
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';
  rating: number;
  casesHandled: number;
  languages: ('EN' | 'AR' | 'UR' | 'HI')[];
}

export interface AgentCertificate {
  id: string;
  agentId: string;
  fileName: string;
  fileSize: number;
  uploadDate: string;
  expiryDate?: string;
  verified: boolean;
}

// Mock FTA-approved tax agents directory
export const FTA_APPROVED_AGENTS: TaxAgent[] = [
  {
    id: 'agent_001',
    name: 'Al Masood Tax Consultancy',
    taxAgentNumber: 'TA-DXB-001',
    emirate: 'Dubai',
    contactInfo: {
      email: 'info@almasoodtax.ae',
      phone: '+971-4-123-4567',
      address: 'Office 1203, Business Bay Tower, Dubai',
    },
    ftaCertificationExpiry: '2025-12-31',
    specialties: ['CIT', 'VAT', 'FREE_ZONE'],
    status: 'ACTIVE',
    rating: 4.8,
    casesHandled: 156,
    languages: ['EN', 'AR'],
  },
  {
    id: 'agent_002',
    name: 'Emirates Tax Advisory Services',
    taxAgentNumber: 'TA-AUH-002',
    emirate: 'Abu Dhabi',
    contactInfo: {
      email: 'contact@emiratestax.ae',
      phone: '+971-2-987-6543',
      address: 'Suite 504, Capital Centre, Abu Dhabi',
    },
    ftaCertificationExpiry: '2026-03-15',
    specialties: ['CIT', 'VAT', 'TRANSFER_PRICING'],
    status: 'ACTIVE',
    rating: 4.9,
    casesHandled: 203,
    languages: ['EN', 'AR', 'UR'],
  },
  {
    id: 'agent_003',
    name: 'Sharjah Business Tax Solutions',
    taxAgentNumber: 'TA-SHJ-003',
    emirate: 'Sharjah',
    contactInfo: {
      email: 'info@sharjahtax.ae',
      phone: '+971-6-555-0123',
      address: 'Floor 7, Al Qasba Tower, Sharjah',
    },
    ftaCertificationExpiry: '2025-09-30',
    specialties: ['VAT', 'CIT'],
    status: 'ACTIVE',
    rating: 4.6,
    casesHandled: 89,
    languages: ['EN', 'AR'],
  },
  {
    id: 'agent_004',
    name: 'Free Zone Tax Experts',
    taxAgentNumber: 'TA-DXB-004',
    emirate: 'Dubai',
    contactInfo: {
      email: 'experts@freezonetax.ae',
      phone: '+971-4-777-8888',
      address: 'DIFC Gate Village 3, Dubai',
    },
    ftaCertificationExpiry: '2025-06-30',
    specialties: ['FREE_ZONE', 'CIT', 'VAT'],
    status: 'ACTIVE',
    rating: 4.7,
    casesHandled: 124,
    languages: ['EN', 'AR', 'HI'],
  },
  {
    id: 'agent_005',
    name: 'Northern Emirates Tax Services',
    taxAgentNumber: 'TA-RAK-005',
    emirate: 'Ras Al Khaimah',
    contactInfo: {
      email: 'rak@northerntax.ae',
      phone: '+971-7-234-5678',
      address: 'RAK Free Trade Zone, Ras Al Khaimah',
    },
    ftaCertificationExpiry: '2024-12-31', // Expiring soon
    specialties: ['VAT', 'CIT'],
    status: 'ACTIVE',
    rating: 4.4,
    casesHandled: 67,
    languages: ['EN', 'AR'],
  },
  {
    id: 'agent_006',
    name: 'Premium Tax Advisors LLC',
    taxAgentNumber: 'TA-AUH-006',
    emirate: 'Abu Dhabi',
    contactInfo: {
      email: 'premium@taxadvisors.ae',
      phone: '+971-2-456-7890',
      address: 'ADGM Square, Al Maryah Island, Abu Dhabi',
    },
    ftaCertificationExpiry: '2023-12-31', // Expired
    specialties: ['CIT', 'TRANSFER_PRICING'],
    status: 'EXPIRED',
    rating: 4.2,
    casesHandled: 45,
    languages: ['EN'],
  },
];

export const getAgentById = (id: string): TaxAgent | undefined => {
  return FTA_APPROVED_AGENTS.find(agent => agent.id === id);
};

export const getActiveAgents = (): TaxAgent[] => {
  return FTA_APPROVED_AGENTS.filter(agent => agent.status === 'ACTIVE');
};

export const filterAgentsByEmirate = (emirate: string): TaxAgent[] => {
  return FTA_APPROVED_AGENTS.filter(agent => 
    agent.emirate.toLowerCase() === emirate.toLowerCase() && agent.status === 'ACTIVE'
  );
};

export const filterAgentsBySpecialty = (specialty: string): TaxAgent[] => {
  return FTA_APPROVED_AGENTS.filter(agent => 
    agent.specialties.includes(specialty as any) && agent.status === 'ACTIVE'
  );
};

export const isAgentCertificationExpiring = (agent: TaxAgent, daysThreshold: number = 30): boolean => {
  const expiryDate = new Date(agent.ftaCertificationExpiry);
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);
  
  return expiryDate <= thresholdDate;
};

export const isAgentCertificationExpired = (agent: TaxAgent): boolean => {
  const expiryDate = new Date(agent.ftaCertificationExpiry);
  const today = new Date();
  
  return expiryDate < today;
};

export const getAgentStatusBadge = (agent: TaxAgent) => {
  if (agent.status === 'EXPIRED' || isAgentCertificationExpired(agent)) {
    return {
      color: 'bg-red-100 text-red-800 border-red-200',
      label: 'Expired',
      icon: '⚠️'
    };
  }
  
  if (isAgentCertificationExpiring(agent)) {
    return {
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      label: 'Expiring Soon',
      icon: '⏰'
    };
  }
  
  return {
    color: 'bg-green-100 text-green-800 border-green-200',
    label: 'Active',
    icon: '✅'
  };
};

export const UAE_EMIRATES = [
  'Abu Dhabi',
  'Dubai', 
  'Sharjah',
  'Ajman',
  'Umm Al Quwain',
  'Ras Al Khaimah',
  'Fujairah'
];

export const TAX_SPECIALTIES = [
  { value: 'CIT', label: 'Corporate Income Tax' },
  { value: 'VAT', label: 'Value Added Tax' },
  { value: 'FREE_ZONE', label: 'Free Zone Taxation' },
  { value: 'TRANSFER_PRICING', label: 'Transfer Pricing' },
  { value: 'CUSTOMS', label: 'Customs & Excise' },
];

// Validation functions
export const validateAgentCertificate = (file: File): { isValid: boolean; error?: string } => {
  // File type validation
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Only PDF and JPG/PNG files are allowed for tax agent certificates.'
    };
  }
  
  // File size validation (5MB limit)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File size must be less than 5MB.'
    };
  }
  
  return { isValid: true };
};

export const getComplianceWarnings = (agent?: TaxAgent): string[] => {
  const warnings: string[] = [];
  
  if (!agent) {
    warnings.push('No tax agent selected. As per Article 10 of the UAE Tax Procedures Law, complex returns may require professional assistance.');
    return warnings;
  }
  
  if (isAgentCertificationExpired(agent)) {
    warnings.push(`Tax agent certification expired on ${new Date(agent.ftaCertificationExpiry).toLocaleDateString()}. Per FTA regulations, only active certified agents may represent taxpayers.`);
  } else if (isAgentCertificationExpiring(agent, 30)) {
    warnings.push(`Tax agent certification expires on ${new Date(agent.ftaCertificationExpiry).toLocaleDateString()}. Consider renewing to avoid filing delays.`);
  }
  
  if (agent.status !== 'ACTIVE') {
    warnings.push('Selected tax agent status is not active. Verify agent standing with FTA before proceeding.');
  }
  
  return warnings;
};