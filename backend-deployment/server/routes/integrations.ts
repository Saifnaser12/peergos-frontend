import { Router } from "express";
import { storage } from "../storage";
import { z } from "zod";

const router = Router();

// Schema for external system integration
const ExternalSystemSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['ACCOUNTING_SOFTWARE', 'ERP', 'BANKING', 'E_COMMERCE', 'CUSTOM']),
  apiUrl: z.string().url().optional(),
  apiKey: z.string().optional(),
  webhookUrl: z.string().url().optional(),
  settings: z.record(z.any()).optional()
});

// Schema for data mapping configuration
const DataMappingSchema = z.object({
  sourceField: z.string(),
  targetField: z.string(),
  transformation: z.enum(['NONE', 'CURRENCY_CONVERT', 'DATE_FORMAT', 'CUSTOM']).optional(),
  customScript: z.string().optional()
});

// Get all integrations for a company
router.get("/", async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      return res.status(401).json({ message: "Company ID required" });
    }

    const integrations = await storage.getIntegrations(companyId);
    res.json(integrations);
  } catch (error) {
    console.error("Error fetching integrations:", error);
    res.status(500).json({ message: "Failed to fetch integrations" });
  }
});

// Create new integration
router.post("/", async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      return res.status(401).json({ message: "Company ID required" });
    }

    const validatedData = ExternalSystemSchema.parse(req.body);
    
    const integration = await storage.createIntegration({
      ...validatedData,
      companyId,
      status: 'INACTIVE',
      lastSync: null
    });

    res.status(201).json(integration);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    console.error("Error creating integration:", error);
    res.status(500).json({ message: "Failed to create integration" });
  }
});

// Update integration
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;
    
    const validatedData = ExternalSystemSchema.partial().parse(req.body);
    
    const integration = await storage.updateIntegration(Number(id), validatedData);
    res.json(integration);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    console.error("Error updating integration:", error);
    res.status(500).json({ message: "Failed to update integration" });
  }
});

// Test integration connection
router.post("/:id/test", async (req, res) => {
  try {
    const { id } = req.params;
    const integration = await storage.getIntegration(Number(id));
    
    if (!integration) {
      return res.status(404).json({ message: "Integration not found" });
    }

    // Simulate connection test
    const testResult = {
      success: true,
      responseTime: Math.floor(Math.random() * 500) + 100,
      timestamp: new Date().toISOString(),
      message: "Connection successful"
    };

    // Update integration with test result
    await storage.updateIntegration(Number(id), {
      lastTestDate: new Date(),
      testResult: testResult
    });

    res.json(testResult);
  } catch (error) {
    console.error("Error testing integration:", error);
    res.status(500).json({ 
      success: false,
      message: "Connection test failed",
      error: error.message 
    });
  }
});

// Activate/deactivate integration
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['ACTIVE', 'INACTIVE', 'ERROR'].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const integration = await storage.updateIntegration(Number(id), { status });
    res.json(integration);
  } catch (error) {
    console.error("Error updating integration status:", error);
    res.status(500).json({ message: "Failed to update integration status" });
  }
});

// Get data mapping for integration
router.get("/:id/mapping", async (req, res) => {
  try {
    const { id } = req.params;
    const mapping = await storage.getDataMapping(Number(id));
    res.json(mapping || []);
  } catch (error) {
    console.error("Error fetching data mapping:", error);
    res.status(500).json({ message: "Failed to fetch data mapping" });
  }
});

// Update data mapping
router.put("/:id/mapping", async (req, res) => {
  try {
    const { id } = req.params;
    const mappings = z.array(DataMappingSchema).parse(req.body);
    
    const result = await storage.updateDataMapping(Number(id), mappings);
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid mapping data", errors: error.errors });
    }
    console.error("Error updating data mapping:", error);
    res.status(500).json({ message: "Failed to update data mapping" });
  }
});

// Trigger manual sync
router.post("/:id/sync", async (req, res) => {
  try {
    const { id } = req.params;
    const { direction = 'IMPORT' } = req.body; // IMPORT, EXPORT, BIDIRECTIONAL
    
    const integration = await storage.getIntegration(Number(id));
    if (!integration || integration.status !== 'ACTIVE') {
      return res.status(400).json({ message: "Integration not active" });
    }

    // Create sync job
    const syncJob = await storage.createSyncJob({
      integrationId: Number(id),
      direction,
      status: 'PENDING',
      startedAt: new Date()
    });

    // In a real implementation, this would trigger background processing
    setTimeout(async () => {
      await storage.updateSyncJob(syncJob.id, {
        status: 'COMPLETED',
        completedAt: new Date(),
        recordsProcessed: Math.floor(Math.random() * 100) + 10,
        recordsSuccess: Math.floor(Math.random() * 90) + 10,
        recordsError: Math.floor(Math.random() * 5)
      });
    }, 2000);

    res.json({ syncJobId: syncJob.id, status: 'STARTED' });
  } catch (error) {
    console.error("Error triggering sync:", error);
    res.status(500).json({ message: "Failed to trigger sync" });
  }
});

// Get sync history
router.get("/:id/sync-history", async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const history = await storage.getSyncHistory(Number(id), {
      page: Number(page),
      limit: Number(limit)
    });
    
    res.json(history);
  } catch (error) {
    console.error("Error fetching sync history:", error);
    res.status(500).json({ message: "Failed to fetch sync history" });
  }
});

// Get sync job status
router.get("/sync-jobs/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await storage.getSyncJob(Number(jobId));
    
    if (!job) {
      return res.status(404).json({ message: "Sync job not found" });
    }
    
    res.json(job);
  } catch (error) {
    console.error("Error fetching sync job:", error);
    res.status(500).json({ message: "Failed to fetch sync job" });
  }
});

export default router;