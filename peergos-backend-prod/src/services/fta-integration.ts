import axios from 'axios';
import { z } from 'zod';
import { db } from '../db';
import { taxFilings, calculationAuditTrail } from '../db/schema';
import { eq } from 'drizzle-orm';

// UAE FTA Configuration
export const FTAConfig = {
  BASE_URL: process.env.FTA_API_URL || 'https://api.tax.gov.ae', // Mock URL for development
  VAT_ENDPOINT: '/vat/returns',
  CIT_ENDPOINT: '/cit/returns',
  TRN_VALIDATION_ENDPOINT: '/validation/trn',
  FILING_STATUS_ENDPOINT: '/filing/status',
  TIMEOUT: 30000, // 30 seconds
  API_VERSION: 'v1'
} as const;

// FTA API Response Schemas
const FTAResponseSchema = z.object({
  status: z.enum(['SUCCESS', 'ERROR', 'PENDING']),
  referenceNumber: z.string().optional(),
  submissionId: z.string().optional(),
  message: z.string(),
  errors: z.array(z.object({
    code: z.string(),
    message: z.string(),
    field: z.string().optional()
  })).optional(),
  timestamp: z.string(),
});

const TRNValidationSchema = z.object({
  trn: z.string(),
  isValid: z.boolean(),
  businessName: z.string().optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'CANCELLED']).optional(),
  registrationDate: z.string().optional(),
});

// VAT Return Submission Schema
const VATReturnSubmissionSchema = z.object({
  companyId: z.number(),
  filingId: z.number(),
  period: z.string(),
  trn: z.string(),
  returnData: z.object({
    totalSupplies: z.number(),
    totalOutputVAT: z.number(),
    totalInputVAT: z.number(),
    netVATDue: z.number(),
    refundClaimed: z.number(),
    adjustments: z.array(z.object({
      type: z.string(),
      amount: z.number(),
      description: z.string()
    })).optional()
  }),
  attachments: z.array(z.object({
    type: z.string(),
    filename: z.string(),
    content: z.string() // Base64 encoded
  })).optional()
});

export type VATReturnSubmission = z.infer<typeof VATReturnSubmissionSchema>;
export type FTAResponse = z.infer<typeof FTAResponseSchema>;

export class FTAIntegrationService {
  private apiKey: string;
  private baseURL: string;

  constructor() {
    this.apiKey = process.env.FTA_API_KEY || 'demo-api-key';
    this.baseURL = FTAConfig.BASE_URL;
  }

  async submitVATReturn(submission: VATReturnSubmission): Promise<FTAResponse> {
    try {
      console.log(`[FTA] Submitting VAT return for company ${submission.companyId}, period ${submission.period}`);
      
      // Validate submission data
      const validatedSubmission = VATReturnSubmissionSchema.parse(submission);
      
      // Prepare FTA payload
      const ftaPayload = this.prepareVATPayload(validatedSubmission);
      
      // Submit to FTA (mock implementation for development)
      const response = await this.makeSecureAPICall(
        'POST', 
        FTAConfig.VAT_ENDPOINT, 
        ftaPayload
      );
      
      // Update filing status in database
      if (response.status === 'SUCCESS') {
        await this.updateFilingStatus(
          validatedSubmission.filingId, 
          'SUBMITTED', 
          response.referenceNumber
        );
        
        // Create audit trail entry
        await this.createSubmissionAuditTrail(validatedSubmission, response);
      }
      
      return response;
    } catch (error) {
      console.error('[FTA] VAT return submission failed:', error);
      
      // Update filing status to failed
      await this.updateFilingStatus(submission.filingId, 'FAILED', null, error.message);
      
      return {
        status: 'ERROR',
        message: error.message || 'VAT return submission failed',
        errors: [{ code: 'SUBMISSION_FAILED', message: error.message }],
        timestamp: new Date().toISOString()
      };
    }
  }

  async submitCITReturn(submission: any): Promise<FTAResponse> {
    try {
      console.log(`[FTA] Submitting CIT return for company ${submission.companyId}, year ${submission.taxYear}`);
      
      // Prepare CIT payload for FTA
      const ftaPayload = this.prepareCITPayload(submission);
      
      // Submit to FTA
      const response = await this.makeSecureAPICall(
        'POST', 
        FTAConfig.CIT_ENDPOINT, 
        ftaPayload
      );
      
      // Update filing status
      if (response.status === 'SUCCESS') {
        await this.updateFilingStatus(
          submission.filingId, 
          'SUBMITTED', 
          response.referenceNumber
        );
      }
      
      return response;
    } catch (error) {
      console.error('[FTA] CIT return submission failed:', error);
      
      await this.updateFilingStatus(submission.filingId, 'FAILED', null, error.message);
      
      return {
        status: 'ERROR',
        message: error.message || 'CIT return submission failed',
        errors: [{ code: 'SUBMISSION_FAILED', message: error.message }],
        timestamp: new Date().toISOString()
      };
    }
  }

  async validateTRN(trn: string): Promise<z.infer<typeof TRNValidationSchema>> {
    try {
      console.log(`[FTA] Validating TRN: ${trn}`);
      
      // Mock TRN validation for development
      const response = await this.makeSecureAPICall(
        'GET', 
        `${FTAConfig.TRN_VALIDATION_ENDPOINT}/${trn}`
      );
      
      // For development, return mock validation
      if (process.env.NODE_ENV === 'development') {
        return {
          trn,
          isValid: trn.length === 15 && /^\d+$/.test(trn),
          businessName: 'Demo Business LLC',
          status: 'ACTIVE',
          registrationDate: '2022-01-01'
        };
      }
      
      return TRNValidationSchema.parse(response);
    } catch (error) {
      console.error('[FTA] TRN validation failed:', error);
      
      return {
        trn,
        isValid: false
      };
    }
  }

  async getFilingStatus(referenceNumber: string): Promise<any> {
    try {
      console.log(`[FTA] Checking filing status for reference: ${referenceNumber}`);
      
      const response = await this.makeSecureAPICall(
        'GET', 
        `${FTAConfig.FILING_STATUS_ENDPOINT}/${referenceNumber}`
      );
      
      return response;
    } catch (error) {
      console.error('[FTA] Filing status check failed:', error);
      throw error;
    }
  }

  async getVATRates(): Promise<any> {
    try {
      // Return current UAE VAT rates and classifications
      return {
        standardRate: 0.05,
        zeroRate: 0.00,
        exemptSupplies: [
          'Educational services',
          'Healthcare services',
          'Financial services',
          'Residential property sales'
        ],
        zeroRatedSupplies: [
          'Exports of goods',
          'International transport',
          'Precious metals for investment'
        ],
        lastUpdated: '2023-01-01'
      };
    } catch (error) {
      console.error('[FTA] VAT rates retrieval failed:', error);
      throw error;
    }
  }

  private async makeSecureAPICall(method: string, endpoint: string, data?: any): Promise<any> {
    try {
      // For development, return mock responses
      if (process.env.NODE_ENV === 'development') {
        return this.getMockResponse(method, endpoint, data);
      }
      
      const config = {
        method,
        url: `${this.baseURL}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Peergos Tax System v1.0'
        },
        data,
        timeout: FTAConfig.TIMEOUT,
        validateStatus: (status: number) => status < 500 // Don't throw on 4xx errors
      };
      
      const response = await axios(config);
      
      if (response.status >= 400) {
        throw new Error(`FTA API error: ${response.status} - ${response.data?.message || 'Unknown error'}`);
      }
      
      return response.data;
    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        throw new Error('FTA API is currently unavailable. Please try again later.');
      }
      
      if (error.response?.status === 401) {
        throw new Error('FTA API authentication failed. Please check your credentials.');
      }
      
      if (error.response?.status === 429) {
        throw new Error('FTA API rate limit exceeded. Please wait before retrying.');
      }
      
      throw error;
    }
  }

  private getMockResponse(method: string, endpoint: string, data?: any): any {
    // Mock responses for development
    if (endpoint.includes('/vat/returns')) {
      return {
        status: 'SUCCESS',
        referenceNumber: `VAT-${Date.now()}`,
        submissionId: `SUB-${Math.random().toString(36).substr(2, 9)}`,
        message: 'VAT return submitted successfully',
        timestamp: new Date().toISOString()
      };
    }
    
    if (endpoint.includes('/cit/returns')) {
      return {
        status: 'SUCCESS',
        referenceNumber: `CIT-${Date.now()}`,
        submissionId: `SUB-${Math.random().toString(36).substr(2, 9)}`,
        message: 'CIT return submitted successfully',
        timestamp: new Date().toISOString()
      };
    }
    
    if (endpoint.includes('/validation/trn')) {
      const trn = endpoint.split('/').pop();
      return {
        trn,
        isValid: trn?.length === 15,
        businessName: 'Demo Business LLC',
        status: 'ACTIVE',
        registrationDate: '2022-01-01'
      };
    }
    
    if (endpoint.includes('/filing/status')) {
      return {
        status: 'PROCESSED',
        submissionDate: new Date().toISOString(),
        processingDate: new Date().toISOString(),
        message: 'Return successfully processed'
      };
    }
    
    return {
      status: 'SUCCESS',
      message: 'Operation completed successfully',
      timestamp: new Date().toISOString()
    };
  }

  private prepareVATPayload(submission: VATReturnSubmission): any {
    return {
      taxpayerIdentification: {
        trn: submission.trn,
        tradeName: 'Company Name', // Would come from company data
      },
      taxPeriod: {
        startDate: submission.period.split('-')[0],
        endDate: submission.period.split('-')[1] || submission.period
      },
      vatReturn: {
        totalValueOfSupplies: submission.returnData.totalSupplies,
        totalOutputVAT: submission.returnData.totalOutputVAT,
        totalInputVAT: submission.returnData.totalInputVAT,
        netVATDue: submission.returnData.netVATDue,
        refundClaimed: submission.returnData.refundClaimed,
        adjustments: submission.returnData.adjustments || []
      },
      attachments: submission.attachments || [],
      declaration: {
        accurateAndComplete: true,
        authorizedSignatory: true,
        submissionDate: new Date().toISOString()
      }
    };
  }

  private prepareCITPayload(submission: any): any {
    return {
      taxpayerIdentification: {
        trn: submission.trn,
        tradeName: submission.companyName,
      },
      taxYear: submission.taxYear,
      financialStatements: {
        accountingIncome: submission.accountingIncome,
        adjustments: submission.adjustments,
        taxableIncome: submission.taxableIncome,
        citLiability: submission.citLiability
      },
      declaration: {
        accurateAndComplete: true,
        authorizedSignatory: true,
        submissionDate: new Date().toISOString()
      }
    };
  }

  private async updateFilingStatus(
    filingId: number, 
    status: string, 
    referenceNumber?: string, 
    errorMessage?: string
  ): Promise<void> {
    try {
      await db.update(taxFilings)
        .set({
          status,
          ftaReference: referenceNumber,
          submittedAt: status === 'SUBMITTED' ? new Date() : undefined,
          // errorMessage field would need to be added to schema
        })
        .where(eq(taxFilings.id, filingId));
      
      console.log(`[FTA] Updated filing ${filingId} status to ${status}`);
    } catch (error) {
      console.error('[FTA] Failed to update filing status:', error);
    }
  }

  private async createSubmissionAuditTrail(
    submission: VATReturnSubmission, 
    response: FTAResponse
  ): Promise<void> {
    try {
      await db.insert(calculationAuditTrail).values({
        companyId: submission.companyId,
        userId: 1, // System user
        calculationType: 'VAT_SUBMISSION',
        referenceId: submission.filingId,
        calculationVersion: '1.0',
        inputData: submission,
        calculationSteps: [{
          step: 1,
          description: 'FTA VAT return submission',
          method: 'FTA API',
          result: response
        }],
        finalResult: response,
        methodUsed: 'FTA Electronic Submission',
        regulatoryReference: 'UAE VAT Law Electronic Filing Requirements'
      });
      
      console.log(`[FTA] Created submission audit trail for filing ${submission.filingId}`);
    } catch (error) {
      console.error('[FTA] Failed to create audit trail:', error);
    }
  }

  // Utility methods for UAE tax compliance
  static validateTRNFormat(trn: string): boolean {
    // UAE TRN format: 15 digits
    return /^\d{15}$/.test(trn);
  }

  static generateFilingDeadline(periodEnd: Date, type: 'VAT' | 'CIT'): Date {
    if (type === 'VAT') {
      // VAT return due 28 days after period end
      return new Date(periodEnd.getTime() + 28 * 24 * 60 * 60 * 1000);
    } else {
      // CIT return due 9 months after year end
      return new Date(periodEnd.getFullYear() + 1, periodEnd.getMonth() + 9, periodEnd.getDate());
    }
  }

  static isFilingPeriodValid(startDate: Date, endDate: Date, type: 'VAT' | 'CIT'): boolean {
    const diffMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                      (endDate.getMonth() - startDate.getMonth());
    
    if (type === 'VAT') {
      return diffMonths === 3; // Quarterly
    } else {
      return diffMonths === 12; // Annual
    }
  }
}

export const ftaIntegration = new FTAIntegrationService();