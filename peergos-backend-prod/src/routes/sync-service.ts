import { Router } from "express";
import { db } from "../db";
import { syncJobs, syncConflicts, insertSyncJobSchema } from "../db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const router = Router();

// Schema for sync configuration
const SyncConfigSchema = z.object({
  integrationId: z.number(),
  dataType: z.string(),
  syncType: z.enum(['FULL_SYNC', 'INCREMENTAL_SYNC', 'CUSTOM']),
  schedule: z.string().optional(), // Cron expression
  filters: z.record(z.any()).optional(),
  mapping: z.record(z.string()).optional()
});

// Get sync configurations
router.get("/api/sync-service/configs", async (req, res) => {
  try {
    const companyId = req.session?.companyId || 1;
    
    // Mock sync configurations - in production this would be stored in database
    const configs = [
      {
        id: 1,
        companyId,
        integrationId: 1,
        dataType: 'transactions',
        syncType: 'INCREMENTAL_SYNC',
        schedule: '0 */6 * * *', // Every 6 hours
        lastSync: '2025-08-28T06:00:00Z',
        nextSync: '2025-08-28T12:00:00Z',
        isActive: true
      },
      {
        id: 2,
        companyId,
        integrationId: 2,
        dataType: 'invoices',
        syncType: 'FULL_SYNC',
        schedule: '0 2 * * *', // Daily at 2 AM
        lastSync: '2025-08-28T02:00:00Z',
        nextSync: '2025-08-29T02:00:00Z',
        isActive: true
      }
    ];
    
    res.json(configs);
  } catch (error) {
    console.error("Error fetching sync configs:", error);
    res.status(500).json({ message: "Failed to fetch sync configurations" });
  }
});

// Create sync configuration
router.post("/api/sync-service/configs", async (req, res) => {
  try {
    const companyId = req.session?.companyId || 1;
    
    const validatedData = SyncConfigSchema.parse(req.body);
    
    // Mock response - in production this would create actual config
    const config = {
      id: Date.now(),
      companyId,
      ...validatedData,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    
    res.status(201).json(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    console.error("Error creating sync config:", error);
    res.status(500).json({ message: "Failed to create sync configuration" });
  }
});

// Trigger manual sync
router.post("/api/sync-service/trigger", async (req, res) => {
  try {
    const { integrationId, dataType, syncType = 'FULL_SYNC' } = req.body;
    const companyId = req.session?.companyId || 1;
    
    const validatedData = insertSyncJobSchema.parse({
      companyId,
      integrationId,
      type: syncType,
      dataType,
      status: 'PENDING',
      recordsProcessed: 0,
      recordsTotal: 0,
      startedAt: new Date(),
    });
    
    const result = await db.insert(syncJobs)
      .values(validatedData)
      .returning();
    
    // Simulate starting the sync job
    setTimeout(async () => {
      try {
        await db.update(syncJobs)
          .set({ 
            status: 'RUNNING',
            recordsTotal: Math.floor(Math.random() * 1000) + 100
          })
          .where(eq(syncJobs.id, result[0].id));
      } catch (error) {
        console.error('Error updating sync job status:', error);
      }
    }, 1000);
    
    res.json({
      message: "Sync job triggered successfully",
      job: result[0]
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    console.error("Error triggering sync:", error);
    res.status(500).json({ message: "Failed to trigger sync" });
  }
});

// Get sync job status
router.get("/api/sync-service/status/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const job = await db.select().from(syncJobs)
      .where(eq(syncJobs.id, Number(jobId)))
      .then(rows => rows[0]);
    
    if (!job) {
      return res.status(404).json({ message: "Sync job not found" });
    }
    
    // Calculate progress
    const recordsTotal = job.recordsTotal || 0;
    const recordsProcessed = job.recordsProcessed || 0;
    const progress = recordsTotal > 0 
      ? Math.round((recordsProcessed / recordsTotal) * 100)
      : 0;
    
    const response = {
      ...job,
      progress,
      duration: job.startedAt && job.completedAt 
        ? new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()
        : job.startedAt 
          ? Date.now() - new Date(job.startedAt).getTime()
          : 0
    };
    
    res.json(response);
  } catch (error) {
    console.error("Error fetching sync status:", error);
    res.status(500).json({ message: "Failed to fetch sync status" });
  }
});

// Resolve sync conflicts
router.post("/api/sync-service/conflicts/resolve", async (req, res) => {
  try {
    const { conflictId, resolution, resolvedData } = req.body;
    const userId = req.session?.userId || 1;
    
    if (!['USE_LOCAL', 'USE_REMOTE', 'MERGE', 'SKIP'].includes(resolution)) {
      return res.status(400).json({ message: "Invalid resolution type" });
    }
    
    const result = await db.update(syncConflicts)
      .set({
        resolution,
        resolvedBy: userId,
        resolvedAt: new Date(),
      })
      .where(eq(syncConflicts.id, conflictId))
      .returning();
    
    if (result.length === 0) {
      return res.status(404).json({ message: "Conflict not found" });
    }
    
    res.json({
      message: "Conflict resolved successfully",
      conflict: result[0]
    });
  } catch (error) {
    console.error("Error resolving conflict:", error);
    res.status(500).json({ message: "Failed to resolve conflict" });
  }
});

// Get sync history
router.get("/api/sync-service/history", async (req, res) => {
  try {
    const companyId = req.session?.companyId || 1;
    const { limit = 50, offset = 0, integrationId, dataType } = req.query;
    
    let query = db.select().from(syncJobs)
      .where(eq(syncJobs.companyId, companyId))
      .orderBy(desc(syncJobs.createdAt))
      .limit(Number(limit))
      .offset(Number(offset));
    
    const jobs = await query;
    
    // Add summary statistics
    const summary = {
      totalJobs: jobs.length,
      completedJobs: jobs.filter(job => job.status === 'COMPLETED').length,
      failedJobs: jobs.filter(job => job.status === 'FAILED').length,
      runningJobs: jobs.filter(job => job.status === 'RUNNING').length,
      totalRecordsProcessed: jobs.reduce((sum, job) => sum + (job.recordsProcessed || 0), 0)
    };
    
    res.json({
      jobs,
      summary,
      pagination: {
        limit: Number(limit),
        offset: Number(offset),
        total: jobs.length
      }
    });
  } catch (error) {
    console.error("Error fetching sync history:", error);
    res.status(500).json({ message: "Failed to fetch sync history" });
  }
});

// Get sync statistics
router.get("/api/sync-service/stats", async (req, res) => {
  try {
    const companyId = req.session?.companyId || 1;
    const { period = '7d' } = req.query;
    
    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    
    const jobs = await db.select().from(syncJobs)
      .where(eq(syncJobs.companyId, companyId));
    
    const recentJobs = jobs.filter(job => 
      job.createdAt && new Date(job.createdAt) >= startDate
    );
    
    const stats = {
      period,
      totalSyncs: recentJobs.length,
      successfulSyncs: recentJobs.filter(job => job.status === 'COMPLETED').length,
      failedSyncs: recentJobs.filter(job => job.status === 'FAILED').length,
      averageDuration: calculateAverageDuration(recentJobs),
      totalRecordsProcessed: recentJobs.reduce((sum, job) => sum + (job.recordsProcessed || 0), 0),
      dataTypeBreakdown: getDataTypeBreakdown(recentJobs),
      successRate: recentJobs.length > 0 
        ? Math.round((recentJobs.filter(job => job.status === 'COMPLETED').length / recentJobs.length) * 100)
        : 0
    };
    
    res.json(stats);
  } catch (error) {
    console.error("Error fetching sync stats:", error);
    res.status(500).json({ message: "Failed to fetch sync statistics" });
  }
});

// Cancel sync job
router.post("/api/sync-service/:jobId/cancel", async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const job = await db.select().from(syncJobs)
      .where(eq(syncJobs.id, Number(jobId)))
      .then(rows => rows[0]);
    
    if (!job) {
      return res.status(404).json({ message: "Sync job not found" });
    }
    
    if (!job.status || !['PENDING', 'RUNNING'].includes(job.status)) {
      return res.status(400).json({ message: "Cannot cancel completed job" });
    }
    
    const result = await db.update(syncJobs)
      .set({ 
        status: 'CANCELLED',
        completedAt: new Date(),
        errorMessage: 'Job cancelled by user'
      })
      .where(eq(syncJobs.id, Number(jobId)))
      .returning();
    
    res.json({
      message: "Sync job cancelled successfully",
      job: result[0]
    });
  } catch (error) {
    console.error("Error cancelling sync job:", error);
    res.status(500).json({ message: "Failed to cancel sync job" });
  }
});

// Helper functions
function calculateAverageDuration(jobs: any[]): number {
  const completedJobs = jobs.filter(job => 
    job.status === 'COMPLETED' && job.startedAt && job.completedAt
  );
  
  if (completedJobs.length === 0) return 0;
  
  const totalDuration = completedJobs.reduce((sum, job) => {
    const duration = new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime();
    return sum + duration;
  }, 0);
  
  return Math.round(totalDuration / completedJobs.length / 1000); // Return in seconds
}

function getDataTypeBreakdown(jobs: any[]): Record<string, number> {
  return jobs.reduce((breakdown, job) => {
    const dataType = job.dataType || 'unknown';
    breakdown[dataType] = (breakdown[dataType] || 0) + 1;
    return breakdown;
  }, {});
}

export default router;