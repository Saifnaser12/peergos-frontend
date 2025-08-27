import { db } from '../db';
import { 
  calculationAuditTrail, 
  taxCalculationBreakdown, 
  calculationSummaryReport,
  amendmentHistory,
  type CalculationAuditTrail,
  type TaxCalculationBreakdown,
  type CalculationResult,
  type CalculationStep,
  type AmendmentRequest,
  type ExportFormat,
  CALCULATION_TYPES
} from '../../shared/calculation-schemas';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export class CalculationAuditService {
  
  /**
   * Record a new calculation with full audit trail
   */
  async recordCalculation(
    companyId: number,
    userId: number,
    calculationType: string,
    inputData: Record<string, any>,
    result: CalculationResult,
    referenceId?: number
  ): Promise<{ auditTrailId: number; version: string }> {
    const version = `v${Date.now()}-${randomUUID().slice(0, 8)}`;
    
    // Insert main audit record
    const [auditRecord] = await db.insert(calculationAuditTrail).values({
      companyId,
      userId,
      calculationType,
      referenceId,
      calculationVersion: version,
      inputData,
      calculationSteps: result.breakdown,
      finalResult: {
        totalAmount: result.totalAmount,
        currency: result.currency,
        method: result.method,
        compliance: result.regulatoryCompliance
      },
      methodUsed: result.method,
      regulatoryReference: result.regulatoryCompliance.reference,
      notes: `Calculation performed using ${result.method} method`
    }).returning();

    // Insert detailed breakdown steps
    const breakdownInserts = result.breakdown.map((step, index) => ({
      auditTrailId: auditRecord.id,
      stepNumber: step.stepNumber,
      stepDescription: step.description,
      formula: step.formula || '',
      inputValues: step.inputs,
      calculation: step.calculation,
      result: step.result.toFixed(4),
      currency: step.currency,
      regulatoryNote: step.notes || step.regulatoryReference
    }));

    if (breakdownInserts.length > 0) {
      await db.insert(taxCalculationBreakdown).values(breakdownInserts);
    }

    return {
      auditTrailId: auditRecord.id,
      version
    };
  }

  /**
   * Get detailed calculation breakdown
   */
  async getCalculationBreakdown(auditTrailId: number): Promise<{
    auditTrail: CalculationAuditTrail;
    breakdown: TaxCalculationBreakdown[];
  }> {
    const [auditTrail] = await db
      .select()
      .from(calculationAuditTrail)
      .where(eq(calculationAuditTrail.id, auditTrailId));

    const breakdown = await db
      .select()
      .from(taxCalculationBreakdown)
      .where(eq(taxCalculationBreakdown.auditTrailId, auditTrailId))
      .orderBy(taxCalculationBreakdown.stepNumber);

    return { auditTrail, breakdown };
  }

  /**
   * Get calculation history for a specific reference
   */
  async getCalculationHistory(
    companyId: number,
    calculationType: string,
    referenceId?: number
  ): Promise<CalculationAuditTrail[]> {
    let query = db
      .select()
      .from(calculationAuditTrail)
      .where(and(
        eq(calculationAuditTrail.companyId, companyId),
        eq(calculationAuditTrail.calculationType, calculationType)
      ));

    if (referenceId) {
      query = query.where(eq(calculationAuditTrail.referenceId, referenceId));
    }

    return await query.orderBy(desc(calculationAuditTrail.timestamp));
  }

  /**
   * Create amendment record
   */
  async createAmendment(amendmentRequest: AmendmentRequest): Promise<number> {
    const changesSummary = Object.entries(amendmentRequest.changes).map(([field, change]) => ({
      field,
      oldValue: change.oldValue,
      newValue: change.newValue,
      reason: change.reason
    }));

    const [amendment] = await db.insert(amendmentHistory).values({
      originalRecordId: amendmentRequest.originalId,
      recordType: amendmentRequest.recordType,
      amendmentType: amendmentRequest.amendmentType,
      previousVersion: { originalId: amendmentRequest.originalId },
      newVersion: amendmentRequest.changes,
      changesSummary,
      reason: amendmentRequest.reason,
      amendedBy: amendmentRequest.requestedBy,
      status: amendmentRequest.urgency === 'CRITICAL' ? 'PENDING' : 'PENDING'
    }).returning();

    return amendment.id;
  }

  /**
   * Generate calculation summary report
   */
  async generateSummaryReport(
    companyId: number,
    reportType: string,
    reportPeriod: string,
    calculationType?: string
  ): Promise<number> {
    // Get calculations for the period
    const calculations = await this.getCalculationsForPeriod(
      companyId, 
      reportPeriod, 
      calculationType
    );

    const totalCalculations = calculations.length;
    const totalTaxAmount = calculations.reduce(
      (sum, calc) => sum + (calc.finalResult as any).totalAmount, 
      0
    );

    // Group by calculation type
    const breakdownByType = calculations.reduce((acc, calc) => {
      const type = calc.calculationType;
      if (!acc[type]) {
        acc[type] = { count: 0, amount: 0 };
      }
      acc[type].count++;
      acc[type].amount += (calc.finalResult as any).totalAmount;
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);

    const summaryData = {
      period: reportPeriod,
      calculationTypes: Object.keys(breakdownByType),
      averageCalculationAmount: totalCalculations > 0 ? totalTaxAmount / totalCalculations : 0,
      complianceRate: this.calculateComplianceRate(calculations),
      amendmentRate: await this.getAmendmentRate(companyId, reportPeriod)
    };

    const [report] = await db.insert(calculationSummaryReport).values({
      companyId,
      reportType,
      reportPeriod,
      totalCalculations,
      totalTaxAmount: totalTaxAmount.toString(),
      breakdownByType,
      summaryData,
      generatedBy: 1 // TODO: Get from context
    }).returning();

    return report.id;
  }

  /**
   * Export calculation details
   */
  async exportCalculationDetails(
    reportId: number,
    format: ExportFormat,
    includeBreakdown: boolean = true
  ): Promise<{ downloadUrl: string; fileName: string }> {
    const [report] = await db
      .select()
      .from(calculationSummaryReport)
      .where(eq(calculationSummaryReport.id, reportId));

    if (!report) {
      throw new Error('Report not found');
    }

    const calculations = await this.getCalculationsForPeriod(
      report.companyId,
      report.reportPeriod
    );

    let exportData: any;
    let fileName: string;
    let mimeType: string;

    switch (format) {
      case 'JSON':
        exportData = await this.prepareJsonExport(report, calculations, includeBreakdown);
        fileName = `calculation-report-${report.reportPeriod}.json`;
        mimeType = 'application/json';
        break;
      
      case 'CSV':
        exportData = await this.prepareCsvExport(calculations);
        fileName = `calculation-report-${report.reportPeriod}.csv`;
        mimeType = 'text/csv';
        break;
      
      case 'EXCEL':
        exportData = await this.prepareExcelExport(report, calculations, includeBreakdown);
        fileName = `calculation-report-${report.reportPeriod}.xlsx`;
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      
      default:
        throw new Error(`Export format ${format} not supported`);
    }

    // Save export info and return download URL
    await db.update(calculationSummaryReport)
      .set({
        exportedAt: new Date(),
        exportFormat: format,
        exportPath: fileName
      })
      .where(eq(calculationSummaryReport.id, reportId));

    return {
      downloadUrl: `/api/reports/download/${fileName}`,
      fileName
    };
  }

  /**
   * Get calculations for a specific period
   */
  private async getCalculationsForPeriod(
    companyId: number,
    period: string,
    calculationType?: string
  ): Promise<CalculationAuditTrail[]> {
    const startDate = new Date(`${period}-01`);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

    let query = db
      .select()
      .from(calculationAuditTrail)
      .where(and(
        eq(calculationAuditTrail.companyId, companyId),
        gte(calculationAuditTrail.timestamp, startDate),
        lte(calculationAuditTrail.timestamp, endDate)
      ));

    if (calculationType) {
      query = db
        .select()
        .from(calculationAuditTrail)
        .where(and(
          eq(calculationAuditTrail.companyId, companyId),
          eq(calculationAuditTrail.calculationType, calculationType),
          gte(calculationAuditTrail.timestamp, startDate),
          lte(calculationAuditTrail.timestamp, endDate)
        ));
    }

    return await query.orderBy(desc(calculationAuditTrail.timestamp));
  }

  /**
   * Calculate compliance rate for calculations
   */
  private calculateComplianceRate(calculations: CalculationAuditTrail[]): number {
    if (calculations.length === 0) return 100;
    
    const compliantCalculations = calculations.filter(calc => {
      const result = calc.finalResult as any;
      return result?.compliance?.compliance === true;
    });

    return (compliantCalculations.length / calculations.length) * 100;
  }

  /**
   * Get amendment rate for a period
   */
  private async getAmendmentRate(companyId: number, period: string): Promise<number> {
    const startDate = new Date(`${period}-01`);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

    const [totalCalculations] = await db
      .select({ count: sql<number>`count(*)` })
      .from(calculationAuditTrail)
      .where(and(
        eq(calculationAuditTrail.companyId, companyId),
        gte(calculationAuditTrail.timestamp, startDate),
        lte(calculationAuditTrail.timestamp, endDate)
      ));

    const [amendments] = await db
      .select({ count: sql<number>`count(*)` })
      .from(amendmentHistory)
      .where(and(
        gte(amendmentHistory.amendedAt, startDate),
        lte(amendmentHistory.amendedAt, endDate)
      ));

    if (totalCalculations.count === 0) return 0;
    return (amendments.count / totalCalculations.count) * 100;
  }

  /**
   * Prepare JSON export
   */
  private async prepareJsonExport(
    report: any,
    calculations: CalculationAuditTrail[],
    includeBreakdown: boolean
  ): Promise<string> {
    const exportData = {
      report: {
        id: report.id,
        period: report.reportPeriod,
        generatedAt: report.generatedAt,
        summary: report.summaryData
      },
      calculations: await Promise.all(calculations.map(async calc => {
        const base = {
          id: calc.id,
          type: calc.calculationType,
          version: calc.calculationVersion,
          timestamp: calc.timestamp,
          method: calc.methodUsed,
          result: calc.finalResult,
          inputs: calc.inputData
        };

        if (includeBreakdown) {
          const breakdown = await db
            .select()
            .from(taxCalculationBreakdown)
            .where(eq(taxCalculationBreakdown.auditTrailId, calc.id))
            .orderBy(taxCalculationBreakdown.stepNumber);
          
          return { ...base, breakdown };
        }

        return base;
      }))
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Prepare CSV export
   */
  private async prepareCsvExport(calculations: CalculationAuditTrail[]): Promise<string> {
    const headers = [
      'ID', 'Type', 'Version', 'Timestamp', 'Method', 
      'Total Amount', 'Currency', 'Status', 'Reference'
    ];

    const rows = calculations.map(calc => {
      const result = calc.finalResult as any;
      return [
        calc.id,
        calc.calculationType,
        calc.calculationVersion,
        calc.timestamp?.toISOString(),
        calc.methodUsed,
        result?.totalAmount || 0,
        result?.currency || 'AED',
        calc.status,
        calc.referenceId || ''
      ];
    });

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Prepare Excel export (simplified - would use a proper Excel library in production)
   */
  private async prepareExcelExport(
    report: any,
    calculations: CalculationAuditTrail[],
    includeBreakdown: boolean
  ): Promise<any> {
    // This would typically use a library like xlsx or exceljs
    // For now, return structured data that could be converted to Excel
    return {
      summary: report.summaryData,
      calculations: calculations.map(calc => ({
        id: calc.id,
        type: calc.calculationType,
        amount: (calc.finalResult as any)?.totalAmount,
        timestamp: calc.timestamp
      }))
    };
  }

  /**
   * Validate calculation for audit compliance
   */
  async validateCalculation(auditTrailId: number, validatedBy: number): Promise<boolean> {
    try {
      await db.update(calculationAuditTrail)
        .set({
          validatedBy,
          validatedAt: new Date(),
          status: 'ACTIVE'
        })
        .where(eq(calculationAuditTrail.id, auditTrailId));

      return true;
    } catch (error) {
      console.error('Error validating calculation:', error);
      return false;
    }
  }

  /**
   * Get audit statistics for dashboard
   */
  async getAuditStatistics(companyId: number): Promise<{
    totalCalculations: number;
    calculationsThisMonth: number;
    amendmentRate: number;
    complianceRate: number;
    pendingValidations: number;
  }> {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    
    const [total] = await db
      .select({ count: sql<number>`count(*)` })
      .from(calculationAuditTrail)
      .where(eq(calculationAuditTrail.companyId, companyId));

    const calculationsThisMonth = await this.getCalculationsForPeriod(companyId, currentMonth);
    const amendmentRate = await this.getAmendmentRate(companyId, currentMonth);
    const complianceRate = this.calculateComplianceRate(calculationsThisMonth);

    const [pending] = await db
      .select({ count: sql<number>`count(*)` })
      .from(calculationAuditTrail)
      .where(and(
        eq(calculationAuditTrail.companyId, companyId),
        eq(calculationAuditTrail.status, 'ACTIVE'),
        sql`validated_at IS NULL`
      ));

    return {
      totalCalculations: total.count,
      calculationsThisMonth: calculationsThisMonth.length,
      amendmentRate,
      complianceRate,
      pendingValidations: pending.count
    };
  }
}