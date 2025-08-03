import { Router } from 'express';
import { CalculationAuditService } from '../services/calculation-audit-service';
import { TaxCalculationEngine } from '../services/tax-calculation-engine';
// Simple auth middleware for now
const requireAuth = (req: any, res: any, next: any) => {
  // Mock authentication - in production would validate JWT/session
  req.user = { id: 1, companyId: 1 };
  next();
};
import { z } from 'zod';

const router = Router();
const auditService = new CalculationAuditService();

// Input validation schemas
const vatCalculationSchema = z.object({
  baseAmount: z.number().positive(),
  vatRate: z.number().min(0).max(100),
  isReverse: z.boolean().default(false),
  exemptions: z.number().min(0).default(0),
  currency: z.string().default('AED'),
  transactionType: z.enum(['SUPPLY', 'IMPORT', 'EXPORT']),
  customerType: z.enum(['B2B', 'B2C', 'GOVERNMENT'])
});

const citCalculationSchema = z.object({
  revenue: z.number().min(0),
  allowableDeductions: z.number().min(0).default(0),
  capitalAllowances: z.number().min(0).default(0),
  previousLosses: z.number().min(0).default(0),
  isSmallBusiness: z.boolean().default(false),
  isQFZP: z.boolean().default(false),
  currency: z.string().default('AED'),
  taxYear: z.number().int().min(2023)
});

const exportRequestSchema = z.object({
  reportId: z.number().int(),
  format: z.enum(['PDF', 'EXCEL', 'JSON', 'CSV']),
  includeBreakdown: z.boolean().default(true)
});

// Calculate VAT with audit trail
router.post('/calculate/vat', requireAuth, async (req, res) => {
  try {
    const inputs = vatCalculationSchema.parse(req.body);
    const companyId = (req as any).user?.companyId || 1;
    const userId = (req as any).user?.id || 1;

    // Validate inputs
    const validation = TaxCalculationEngine.validateInputs('VAT', inputs);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Invalid calculation inputs',
        details: validation.errors
      });
    }

    // Perform calculation
    const result = TaxCalculationEngine.calculateVAT(inputs);

    // Record in audit trail
    const auditInfo = await auditService.recordCalculation(
      companyId,
      userId,
      'VAT',
      inputs,
      result,
      req.body.referenceId
    );

    res.json({
      calculation: result,
      auditTrailId: auditInfo.auditTrailId,
      version: auditInfo.version
    });
  } catch (error) {
    console.error('VAT calculation error:', error);
    res.status(500).json({
      error: 'Calculation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Calculate CIT with audit trail
router.post('/calculate/cit', requireAuth, async (req, res) => {
  try {
    const inputs = citCalculationSchema.parse(req.body);
    const companyId = (req as any).user?.companyId || 1;
    const userId = (req as any).user?.id || 1;

    // Validate inputs
    const validation = TaxCalculationEngine.validateInputs('CIT', inputs);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Invalid calculation inputs',
        details: validation.errors
      });
    }

    // Perform calculation
    const result = TaxCalculationEngine.calculateCIT(inputs);

    // Record in audit trail
    const auditInfo = await auditService.recordCalculation(
      companyId,
      userId,
      'CIT',
      inputs,
      result,
      req.body.referenceId
    );

    res.json({
      calculation: result,
      auditTrailId: auditInfo.auditTrailId,
      version: auditInfo.version
    });
  } catch (error) {
    console.error('CIT calculation error:', error);
    res.status(500).json({
      error: 'Calculation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get audit trail with filters
router.get('/trail', requireAuth, async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId || 1;
    const { type, dateFrom, dateTo, status, search } = req.query;

    // For now, get calculation history by type
    if (type) {
      const history = await auditService.getCalculationHistory(
        companyId,
        type as string
      );
      return res.json(history);
    }

    // If no type specified, get all recent calculations
    const allHistory = await auditService.getCalculationHistory(companyId, 'VAT');
    res.json(allHistory);
  } catch (error) {
    console.error('Audit trail fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch audit trail',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get calculation breakdown
router.get('/breakdown/:auditTrailId', requireAuth, async (req, res) => {
  try {
    const auditTrailId = parseInt(req.params.auditTrailId);
    if (isNaN(auditTrailId)) {
      return res.status(400).json({ error: 'Invalid audit trail ID' });
    }

    const breakdown = await auditService.getCalculationBreakdown(auditTrailId);
    
    if (!breakdown.auditTrail) {
      return res.status(404).json({ error: 'Calculation not found' });
    }

    // Transform the data for frontend consumption
    const calculationResult = {
      totalAmount: (breakdown.auditTrail.finalResult as any)?.totalAmount || 0,
      currency: (breakdown.auditTrail.finalResult as any)?.currency || 'AED',
      breakdown: breakdown.breakdown.map(step => ({
        stepNumber: step.stepNumber,
        description: step.stepDescription,
        formula: step.formula,
        inputs: step.inputValues,
        calculation: step.calculation,
        result: parseFloat(step.result),
        currency: step.currency,
        notes: step.regulatoryNote
      })),
      method: breakdown.auditTrail.methodUsed,
      regulatoryCompliance: (breakdown.auditTrail.finalResult as any)?.compliance || {
        regulation: 'UAE Tax Law',
        reference: breakdown.auditTrail.regulatoryReference,
        compliance: true
      },
      metadata: {
        calculatedAt: breakdown.auditTrail.timestamp?.toISOString(),
        calculatedBy: breakdown.auditTrail.userId,
        version: breakdown.auditTrail.calculationVersion,
        inputs: breakdown.auditTrail.inputData
      }
    };

    res.json({
      auditTrail: breakdown.auditTrail,
      calculation: calculationResult
    });
  } catch (error) {
    console.error('Breakdown fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch calculation breakdown',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get audit statistics
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId || 1;
    const stats = await auditService.getAuditStatistics(companyId);
    res.json(stats);
  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch audit statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Export calculation details
router.post('/export', requireAuth, async (req, res) => {
  try {
    const { reportId, format, includeBreakdown } = exportRequestSchema.parse(req.body);
    
    const exportResult = await auditService.exportCalculationDetails(
      reportId,
      format,
      includeBreakdown
    );

    res.json(exportResult);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      error: 'Export failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Validate calculation
router.post('/validate/:auditTrailId', requireAuth, async (req, res) => {
  try {
    const auditTrailId = parseInt(req.params.auditTrailId);
    const userId = (req as any).user?.id || 1;

    if (isNaN(auditTrailId)) {
      return res.status(400).json({ error: 'Invalid audit trail ID' });
    }

    const success = await auditService.validateCalculation(auditTrailId, userId);
    
    if (success) {
      res.json({ message: 'Calculation validated successfully' });
    } else {
      res.status(500).json({ error: 'Validation failed' });
    }
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({
      error: 'Validation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Generate summary report
router.post('/report/generate', requireAuth, async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId || 1;
    const { reportType, reportPeriod, calculationType } = req.body;

    if (!reportType || !reportPeriod) {
      return res.status(400).json({
        error: 'Report type and period are required'
      });
    }

    const reportId = await auditService.generateSummaryReport(
      companyId,
      reportType,
      reportPeriod,
      calculationType
    );

    res.json({
      reportId,
      message: 'Summary report generated successfully'
    });
  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({
      error: 'Failed to generate report',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create amendment
router.post('/amend', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.id || 1;
    const amendmentRequest = {
      ...req.body,
      requestedBy: userId
    };

    const amendmentId = await auditService.createAmendment(amendmentRequest);

    res.json({
      amendmentId,
      message: 'Amendment request created successfully'
    });
  } catch (error) {
    console.error('Amendment creation error:', error);
    res.status(500).json({
      error: 'Failed to create amendment',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;