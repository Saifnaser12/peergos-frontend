import { Router } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { triggerWebhook } from "./webhooks";

const router = Router();

// Schema for sync configuration
const SyncConfigSchema = z.object({
  integrationId: z.number(),
  direction: z.enum(['IMPORT', 'EXPORT', 'BIDIRECTIONAL']),
  schedule: z.object({
    frequency: z.enum(['MANUAL', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY']),
    time: z.string().optional(), // HH:MM format for daily/weekly/monthly
    dayOfWeek: z.number().min(0).max(6).optional(), // 0=Sunday for weekly
    dayOfMonth: z.number().min(1).max(31).optional() // For monthly
  }),
  dataTypes: z.array(z.enum(['TRANSACTIONS', 'INVOICES', 'CUSTOMERS', 'PRODUCTS', 'ACCOUNTS'])),
  lastSyncDate: z.date().optional(),
  isActive: z.boolean().default(true)
});

// Schema for conflict resolution
const ConflictResolutionSchema = z.object({
  conflictType: z.enum(['DATA_MISMATCH', 'DUPLICATE_RECORD', 'MISSING_DEPENDENCY']),
  resolution: z.enum(['USE_SOURCE', 'USE_TARGET', 'MERGE', 'SKIP', 'MANUAL_REVIEW']),
  field: z.string().optional(),
  sourceValue: z.any().optional(),
  targetValue: z.any().optional()
});

// Get sync configurations
router.get("/configs", async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      return res.status(401).json({ message: "Company ID required" });
    }

    const configs = await storage.getSyncConfigs(companyId);
    res.json(configs);
  } catch (error) {
    console.error("Error fetching sync configs:", error);
    res.status(500).json({ message: "Failed to fetch sync configurations" });
  }
});

// Create sync configuration
router.post("/configs", async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      return res.status(401).json({ message: "Company ID required" });
    }

    const validatedData = SyncConfigSchema.parse(req.body);
    
    // Verify integration exists and belongs to company
    const integration = await storage.getIntegration(validatedData.integrationId);
    if (!integration || integration.companyId !== companyId) {
      return res.status(404).json({ message: "Integration not found" });
    }

    const config = await storage.createSyncConfig({
      ...validatedData,
      companyId,
      createdAt: new Date()
    });

    res.status(201).json(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid sync configuration", errors: error.errors });
    }
    console.error("Error creating sync config:", error);
    res.status(500).json({ message: "Failed to create sync configuration" });
  }
});

// Update sync configuration
router.put("/configs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;
    
    const validatedData = SyncConfigSchema.partial().parse(req.body);
    
    const config = await storage.updateSyncConfig(Number(id), validatedData);
    if (!config || config.companyId !== companyId) {
      return res.status(404).json({ message: "Sync configuration not found" });
    }

    res.json(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid sync configuration", errors: error.errors });
    }
    console.error("Error updating sync config:", error);
    res.status(500).json({ message: "Failed to update sync configuration" });
  }
});

// Delete sync configuration
router.delete("/configs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;
    
    const config = await storage.getSyncConfig(Number(id));
    if (!config || config.companyId !== companyId) {
      return res.status(404).json({ message: "Sync configuration not found" });
    }

    await storage.deleteSyncConfig(Number(id));
    res.json({ message: "Sync configuration deleted successfully" });
  } catch (error) {
    console.error("Error deleting sync config:", error);
    res.status(500).json({ message: "Failed to delete sync configuration" });
  }
});

// Trigger manual sync
router.post("/trigger", async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      return res.status(401).json({ message: "Company ID required" });
    }

    const { integrationId, direction = 'IMPORT', dataTypes } = req.body;
    
    const integration = await storage.getIntegration(integrationId);
    if (!integration || integration.companyId !== companyId) {
      return res.status(404).json({ message: "Integration not found" });
    }

    if (integration.status !== 'ACTIVE') {
      return res.status(400).json({ message: "Integration is not active" });
    }

    // Create sync job
    const syncJob = await storage.createSyncJob({
      integrationId,
      direction,
      dataTypes: dataTypes || ['TRANSACTIONS'],
      status: 'PENDING',
      startedAt: new Date(),
      triggeredBy: req.user.id
    });

    // Start sync process
    processSyncJob(syncJob.id);

    res.json({ 
      syncJobId: syncJob.id, 
      status: 'STARTED',
      message: 'Sync job has been queued for processing'
    });
  } catch (error) {
    console.error("Error triggering sync:", error);
    res.status(500).json({ message: "Failed to trigger sync" });
  }
});

// Get sync status
router.get("/status/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;
    const companyId = req.user?.companyId;
    
    const job = await storage.getSyncJob(Number(jobId));
    if (!job) {
      return res.status(404).json({ message: "Sync job not found" });
    }

    // Verify job belongs to user's company
    const integration = await storage.getIntegration(job.integrationId);
    if (!integration || integration.companyId !== companyId) {
      return res.status(404).json({ message: "Sync job not found" });
    }

    // Get detailed sync status with conflicts if any
    const conflicts = await storage.getSyncConflicts(Number(jobId));
    
    res.json({
      ...job,
      conflicts,
      progress: calculateSyncProgress(job)
    });
  } catch (error) {
    console.error("Error fetching sync status:", error);
    res.status(500).json({ message: "Failed to fetch sync status" });
  }
});

// Resolve sync conflicts
router.post("/conflicts/resolve", async (req, res) => {
  try {
    const { conflictId, resolution } = req.body;
    
    const conflict = await storage.getSyncConflict(conflictId);
    if (!conflict) {
      return res.status(404).json({ message: "Conflict not found" });
    }

    const validatedResolution = ConflictResolutionSchema.parse(resolution);
    
    // Apply resolution
    const result = await resolveSyncConflict(conflict, validatedResolution);
    
    // Update conflict status
    await storage.updateSyncConflict(conflictId, {
      status: 'RESOLVED',
      resolution: validatedResolution,
      resolvedAt: new Date(),
      resolvedBy: req.user.id
    });

    res.json({ 
      success: true, 
      result,
      message: 'Conflict resolved successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid resolution", errors: error.errors });
    }
    console.error("Error resolving conflict:", error);
    res.status(500).json({ message: "Failed to resolve conflict" });
  }
});

// Get sync history
router.get("/history", async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const { 
      page = 1, 
      limit = 20, 
      integrationId, 
      status, 
      startDate, 
      endDate 
    } = req.query;
    
    const history = await storage.getSyncHistory(companyId, {
      page: Number(page),
      limit: Number(limit),
      integrationId: integrationId ? Number(integrationId) : undefined,
      status: status as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    });
    
    res.json(history);
  } catch (error) {
    console.error("Error fetching sync history:", error);
    res.status(500).json({ message: "Failed to fetch sync history" });
  }
});

// Get sync statistics
router.get("/stats", async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const { period = '30d' } = req.query;
    
    const stats = await storage.getSyncStats(companyId, period as string);
    
    res.json({
      totalSyncs: stats.totalSyncs,
      successfulSyncs: stats.successfulSyncs,
      failedSyncs: stats.failedSyncs,
      totalRecordsProcessed: stats.totalRecordsProcessed,
      totalConflicts: stats.totalConflicts,
      avgSyncDuration: stats.avgSyncDuration,
      syncsByDataType: stats.syncsByDataType,
      syncsByIntegration: stats.syncsByIntegration,
      recentActivity: stats.recentActivity
    });
  } catch (error) {
    console.error("Error fetching sync stats:", error);
    res.status(500).json({ message: "Failed to fetch sync statistics" });
  }
});

// Cancel sync job
router.post("/:jobId/cancel", async (req, res) => {
  try {
    const { jobId } = req.params;
    const companyId = req.user?.companyId;
    
    const job = await storage.getSyncJob(Number(jobId));
    if (!job) {
      return res.status(404).json({ message: "Sync job not found" });
    }

    const integration = await storage.getIntegration(job.integrationId);
    if (!integration || integration.companyId !== companyId) {
      return res.status(404).json({ message: "Sync job not found" });
    }

    if (!['PENDING', 'RUNNING'].includes(job.status)) {
      return res.status(400).json({ message: "Cannot cancel completed sync job" });
    }

    await storage.updateSyncJob(Number(jobId), {
      status: 'CANCELLED',
      completedAt: new Date(),
      errorMessage: 'Cancelled by user'
    });

    res.json({ message: "Sync job cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling sync job:", error);
    res.status(500).json({ message: "Failed to cancel sync job" });
  }
});

// Helper functions
async function processSyncJob(jobId: number): Promise<void> {
  try {
    const job = await storage.getSyncJob(jobId);
    if (!job) return;

    // Update job status to running
    await storage.updateSyncJob(jobId, {
      status: 'RUNNING',
      startedAt: new Date()
    });

    const integration = await storage.getIntegration(job.integrationId);
    if (!integration) {
      throw new Error('Integration not found');
    }

    let totalRecords = 0;
    let successRecords = 0;
    let errorRecords = 0;
    const conflicts: any[] = [];

    // Process each data type
    for (const dataType of job.dataTypes) {
      const result = await syncDataType(integration, dataType, job.direction);
      
      totalRecords += result.totalRecords;
      successRecords += result.successRecords;
      errorRecords += result.errorRecords;
      conflicts.push(...result.conflicts);
    }

    // Save conflicts to database
    for (const conflict of conflicts) {
      await storage.createSyncConflict({
        syncJobId: jobId,
        ...conflict
      });
    }

    // Update job completion
    await storage.updateSyncJob(jobId, {
      status: conflicts.length > 0 ? 'COMPLETED_WITH_CONFLICTS' : 'COMPLETED',
      completedAt: new Date(),
      recordsProcessed: totalRecords,
      recordsSuccess: successRecords,
      recordsError: errorRecords
    });

    // Trigger webhook
    await triggerWebhook(integration.companyId, 'INTEGRATION_SYNC_COMPLETED', {
      syncJobId: jobId,
      integrationId: integration.id,
      status: conflicts.length > 0 ? 'COMPLETED_WITH_CONFLICTS' : 'COMPLETED',
      recordsProcessed: totalRecords,
      recordsSuccess: successRecords,
      recordsError: errorRecords,
      conflictsCount: conflicts.length
    });

  } catch (error) {
    console.error('Error processing sync job:', error);
    
    await storage.updateSyncJob(jobId, {
      status: 'FAILED',
      completedAt: new Date(),
      errorMessage: error.message
    });
  }
}

async function syncDataType(integration: any, dataType: string, direction: string): Promise<{
  totalRecords: number;
  successRecords: number;
  errorRecords: number;
  conflicts: any[];
}> {
  // This is a simplified implementation
  // In a real system, this would connect to external APIs
  
  const mockResult = {
    totalRecords: Math.floor(Math.random() * 100) + 10,
    successRecords: 0,
    errorRecords: 0,
    conflicts: []
  };

  mockResult.successRecords = Math.floor(mockResult.totalRecords * 0.9);
  mockResult.errorRecords = mockResult.totalRecords - mockResult.successRecords;

  // Simulate some conflicts
  if (Math.random() > 0.7) {
    mockResult.conflicts.push({
      recordId: 'REC_' + Math.random().toString(36).substr(2, 9),
      conflictType: 'DATA_MISMATCH',
      field: 'amount',
      sourceValue: 1500.00,
      targetValue: 1450.00,
      status: 'PENDING'
    });
  }

  return mockResult;
}

async function resolveSyncConflict(conflict: any, resolution: any): Promise<any> {
  // This would contain the actual logic to apply the resolution
  // For now, return a mock result
  
  return {
    applied: true,
    finalValue: resolution.resolution === 'USE_SOURCE' ? conflict.sourceValue : conflict.targetValue,
    recordUpdated: true
  };
}

function calculateSyncProgress(job: any): number {
  if (job.status === 'PENDING') return 0;
  if (job.status === 'RUNNING') {
    // Estimate progress based on processing time
    const elapsed = Date.now() - new Date(job.startedAt).getTime();
    const estimatedDuration = 60000; // 1 minute estimate
    return Math.min(Math.floor((elapsed / estimatedDuration) * 100), 95);
  }
  if (['COMPLETED', 'COMPLETED_WITH_CONFLICTS', 'FAILED', 'CANCELLED'].includes(job.status)) {
    return 100;
  }
  return 0;
}

export default router;