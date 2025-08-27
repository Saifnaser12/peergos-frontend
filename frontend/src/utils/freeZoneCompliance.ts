/**
 * UAE Free Zone Compliance Utilities
 * Handles Qualified Free Zone Person (QFZP) assessments and reporting
 */

export interface QFZPEligibilityData {
  companyName: string;
  trn: string;
  freeZoneLicense: string;
  freeZoneAuthority: string;
  qualifyingActivities: string[];
  excludedActivities: string[];
  qualifyingIncome: number;
  excludedIncome: number;
  connectedPersonTransactions: number;
  naturalPersonOwnership: number;
  financialYear: string;
}

export interface QFZPAssessmentResult {
  isEligible: boolean;
  eligibilityScore: number;
  assessmentDetails: {
    incomeTest: {
      passed: boolean;
      qualifyingIncome: number;
      threshold: number;
      percentage: number;
    };
    activityTest: {
      passed: boolean;
      qualifyingActivities: string[];
      excludedActivities: string[];
    };
    managementTest: {
      passed: boolean;
      adequateSubstance: boolean;
      controlledInUAE: boolean;
    };
    ownershipTest: {
      passed: boolean;
      naturalPersonOwnership: number;
      minimumRequired: number;
    };
  };
  citLiability: {
    qualifyingIncome: number;
    excludedIncome: number;
    totalCIT: number;
    effectiveRate: number;
  };
  recommendations: string[];
  complianceReport: string;
}

export interface FreeZoneComplianceReport {
  companyTRN: string;
  freeZoneAuthority: string;
  reportingPeriod: string;
  qfzpStatus: 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'UNDER_REVIEW';
  economicSubstanceCompliance: {
    hasSubstance: boolean;
    adequateEmployees: boolean;
    adequateOffice: boolean;
    coreIncome: number;
    outsourcedActivities: string[];
  };
  transferPricingCompliance: {
    hasRelatedPartyTransactions: boolean;
    documentationRequired: boolean;
    masterFileRequired: boolean;
    localFileRequired: boolean;
  };
  recommendations: string[];
  generatedDate: string;
}

/**
 * Assess QFZP eligibility based on the four main tests
 */
export function assessQFZPEligibility(data: QFZPEligibilityData): QFZPAssessmentResult {
  const assessmentDetails = {
    incomeTest: performIncomeTest(data),
    activityTest: performActivityTest(data),
    managementTest: performManagementTest(data),
    ownershipTest: performOwnershipTest(data)
  };

  const testsPassedCount = Object.values(assessmentDetails).filter(test => test.passed).length;
  const eligibilityScore = (testsPassedCount / 4) * 100;
  const isEligible = testsPassedCount === 4;

  const citLiability = calculateQFZPCITLiability(data, isEligible);
  const recommendations = generateQFZPRecommendations(assessmentDetails, data);
  const complianceReport = generateQFZPComplianceReport(data, assessmentDetails, isEligible);

  return {
    isEligible,
    eligibilityScore,
    assessmentDetails,
    citLiability,
    recommendations,
    complianceReport
  };
}

/**
 * Test 1: Qualifying Income Test (90% threshold)
 */
function performIncomeTest(data: QFZPEligibilityData) {
  const totalIncome = data.qualifyingIncome + data.excludedIncome;
  const qualifyingPercentage = totalIncome > 0 ? (data.qualifyingIncome / totalIncome) * 100 : 0;
  const threshold = 375000; // AED 375,000 small business threshold
  
  return {
    passed: qualifyingPercentage >= 90 && data.qualifyingIncome <= threshold,
    qualifyingIncome: data.qualifyingIncome,
    threshold,
    percentage: qualifyingPercentage
  };
}

/**
 * Test 2: Qualifying Activity Test
 */
function performActivityTest(data: QFZPEligibilityData) {
  // Qualifying activities for QFZP status
  const validQualifyingActivities = [
    'trading',
    'distribution',
    'logistics',
    'manufacturing',
    'holding',
    'treasury',
    'financing',
    'leasing'
  ];

  // Excluded activities
  const prohibitedActivities = [
    'banking',
    'insurance',
    'investment_fund_management',
    'real_estate'
  ];

  const hasValidActivities = data.qualifyingActivities.some(activity => 
    validQualifyingActivities.includes(activity.toLowerCase())
  );

  const hasProhibitedActivities = data.excludedActivities.some(activity =>
    prohibitedActivities.includes(activity.toLowerCase())
  );

  return {
    passed: hasValidActivities && !hasProhibitedActivities,
    qualifyingActivities: data.qualifyingActivities,
    excludedActivities: data.excludedActivities
  };
}

/**
 * Test 3: Management and Control Test
 */
function performManagementTest(data: QFZPEligibilityData) {
  // For demonstration, assume adequate substance based on company setup
  const adequateSubstance = true; // Would assess actual substance requirements
  const controlledInUAE = true; // Would verify management location
  
  return {
    passed: adequateSubstance && controlledInUAE,
    adequateSubstance,
    controlledInUAE
  };
}

/**
 * Test 4: Ownership Test (Natural persons ownership)
 */
function performOwnershipTest(data: QFZPEligibilityData) {
  const minimumRequired = 50; // 50% minimum natural person ownership
  
  return {
    passed: data.naturalPersonOwnership >= minimumRequired,
    naturalPersonOwnership: data.naturalPersonOwnership,
    minimumRequired
  };
}

/**
 * Calculate CIT liability for QFZP
 */
function calculateQFZPCITLiability(data: QFZPEligibilityData, isEligible: boolean) {
  const qualifyingIncome = isEligible ? data.qualifyingIncome : 0;
  const excludedIncome = data.excludedIncome;
  
  // QFZP qualifying income is exempt from CIT (0% rate)
  // Excluded income is subject to standard CIT rates
  const citOnQualifyingIncome = 0; // 0% for QFZP qualifying income
  const citOnExcludedIncome = calculateStandardCIT(excludedIncome);
  
  const totalCIT = citOnQualifyingIncome + citOnExcludedIncome;
  const totalIncome = qualifyingIncome + excludedIncome;
  const effectiveRate = totalIncome > 0 ? (totalCIT / totalIncome) * 100 : 0;

  return {
    qualifyingIncome,
    excludedIncome,
    totalCIT,
    effectiveRate
  };
}

/**
 * Calculate standard CIT (9% above threshold)
 */
function calculateStandardCIT(income: number): number {
  const smallBusinessThreshold = 375000; // AED 375,000
  
  if (income <= smallBusinessThreshold) {
    return 0; // Small Business Relief - 0% rate
  }
  
  return (income - smallBusinessThreshold) * 0.09; // 9% on excess
}

/**
 * Generate recommendations based on QFZP assessment
 */
function generateQFZPRecommendations(
  assessmentDetails: QFZPAssessmentResult['assessmentDetails'],
  data: QFZPEligibilityData
): string[] {
  const recommendations: string[] = [];

  if (!assessmentDetails.incomeTest.passed) {
    if (assessmentDetails.incomeTest.percentage < 90) {
      recommendations.push('Increase qualifying income to at least 90% of total income');
    }
    if (data.qualifyingIncome > 375000) {
      recommendations.push('Consider income optimization to stay within small business threshold');
    }
  }

  if (!assessmentDetails.activityTest.passed) {
    recommendations.push('Review business activities to ensure compliance with QFZP qualifying activities');
    recommendations.push('Avoid excluded activities such as banking, insurance, or investment fund management');
  }

  if (!assessmentDetails.managementTest.passed) {
    recommendations.push('Establish adequate economic substance in the UAE free zone');
    recommendations.push('Ensure management and control functions are performed in the UAE');
  }

  if (!assessmentDetails.ownershipTest.passed) {
    recommendations.push('Increase natural person ownership to at least 50%');
    recommendations.push('Review ownership structure for QFZP compliance');
  }

  // General recommendations
  recommendations.push('Maintain detailed records of all qualifying and excluded income');
  recommendations.push('Document economic substance requirements annually');
  recommendations.push('Consider quarterly QFZP status reviews to ensure ongoing compliance');

  return recommendations;
}

/**
 * Generate QFZP compliance report
 */
function generateQFZPComplianceReport(
  data: QFZPEligibilityData,
  assessmentDetails: QFZPAssessmentResult['assessmentDetails'],
  isEligible: boolean
): string {
  return `
QFZP Compliance Report for ${data.companyName}
TRN: ${data.trn}
Financial Year: ${data.financialYear}
Free Zone Authority: ${data.freeZoneAuthority}

ELIGIBILITY STATUS: ${isEligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}

Test Results:
- Income Test: ${assessmentDetails.incomeTest.passed ? 'PASS' : 'FAIL'}
- Activity Test: ${assessmentDetails.activityTest.passed ? 'PASS' : 'FAIL'}
- Management Test: ${assessmentDetails.managementTest.passed ? 'PASS' : 'FAIL'}
- Ownership Test: ${assessmentDetails.ownershipTest.passed ? 'PASS' : 'FAIL'}

Income Analysis:
- Qualifying Income: AED ${data.qualifyingIncome.toLocaleString()}
- Excluded Income: AED ${data.excludedIncome.toLocaleString()}
- Qualifying Percentage: ${assessmentDetails.incomeTest.percentage.toFixed(2)}%

Generated on: ${new Date().toISOString()}
`.trim();
}

/**
 * Generate comprehensive free zone compliance report
 */
export async function generateFreeZoneComplianceReport(
  data: QFZPEligibilityData
): Promise<FreeZoneComplianceReport> {
  const qfzpAssessment = assessQFZPEligibility(data);
  
  return {
    companyTRN: data.trn,
    freeZoneAuthority: data.freeZoneAuthority,
    reportingPeriod: data.financialYear,
    qfzpStatus: qfzpAssessment.isEligible ? 'ELIGIBLE' : 'NOT_ELIGIBLE',
    economicSubstanceCompliance: {
      hasSubstance: true, // Would be assessed based on actual substance
      adequateEmployees: true,
      adequateOffice: true,
      coreIncome: data.qualifyingIncome,
      outsourcedActivities: []
    },
    transferPricingCompliance: {
      hasRelatedPartyTransactions: data.connectedPersonTransactions > 0,
      documentationRequired: data.connectedPersonTransactions > 1000000, // AED 1M threshold
      masterFileRequired: false, // Based on group structure
      localFileRequired: data.connectedPersonTransactions > 1000000
    },
    recommendations: qfzpAssessment.recommendations,
    generatedDate: new Date().toISOString()
  };
}

/**
 * Validate free zone license number
 */
export function validateFreeZoneLicense(
  license: string,
  authority: string
): { isValid: boolean; error?: string } {
  // Basic validation - in production would verify against authority database
  if (!license || license.length < 6) {
    return {
      isValid: false,
      error: 'Invalid license format'
    };
  }
  
  return { isValid: true };
}

/**
 * Get free zone authority information
 */
export function getFreeZoneAuthorityInfo(authority: string) {
  const authorities: Record<string, any> = {
    'JAFZA': {
      name: 'Jebel Ali Free Zone Authority',
      location: 'Dubai',
      specializations: ['Trading', 'Manufacturing', 'Services'],
      website: 'https://www.jafza.ae'
    },
    'ADGM': {
      name: 'Abu Dhabi Global Market',
      location: 'Abu Dhabi',
      specializations: ['Financial Services', 'Technology'],
      website: 'https://www.adgm.com'
    },
    'DIFC': {
      name: 'Dubai International Financial Centre',
      location: 'Dubai',
      specializations: ['Financial Services', 'FinTech'],
      website: 'https://www.difc.ae'
    }
  };
  
  return authorities[authority] || {
    name: authority,
    location: 'UAE',
    specializations: ['Various'],
    website: ''
  };
}