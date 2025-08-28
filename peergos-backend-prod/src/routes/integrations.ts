import { Router } from "express";
import { db } from "../db";
import { integrations, insertIntegrationSchema } from "../db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

// Schema for data mapping configuration
const DataMappingSchema = z.object({
  sourceField: z.string(),
  targetField: z.string(),
  transformation: z.enum(['NONE', 'CURRENCY_CONVERT', 'DATE_FORMAT', 'CUSTOM']).optional(),
  customScript: z.string().optional()
});

// Get all integrations for a company
router.get("/api/integrations", async (req, res) => {
  try {
    const companyId = req.session?.companyId || 1;
    
    const integrationsResult = await db.select().from(integrations)
      .where(eq(integrations.companyId, companyId));
    
    res.json(integrationsResult);
  } catch (error) {
    console.error("Error fetching integrations:", error);
    res.status(500).json({ message: "Failed to fetch integrations" });
  }
});

// Create new integration
router.post("/api/integrations", async (req, res) => {
  try {
    const companyId = req.session?.companyId || 1;
    
    const validatedData = insertIntegrationSchema.parse({
      ...req.body,
      companyId,
      status: 'INACTIVE',
      lastSync: null
    });
    
    const result = await db.insert(integrations)
      .values(validatedData)
      .returning();

    res.status(201).json(result[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    console.error("Error creating integration:", error);
    res.status(500).json({ message: "Failed to create integration" });
  }
});

// Update integration
router.put("/api/integrations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.session?.companyId || 1;
    
    const validatedData = insertIntegrationSchema.partial().parse(req.body);
    
    const result = await db.update(integrations)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(integrations.id, Number(id)))
      .returning();
    
    if (result.length === 0) {
      return res.status(404).json({ message: "Integration not found" });
    }
    
    res.json(result[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    console.error("Error updating integration:", error);
    res.status(500).json({ message: "Failed to update integration" });
  }
});

// Delete integration
router.delete("/api/integrations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.session?.companyId || 1;
    
    const result = await db.delete(integrations)
      .where(eq(integrations.id, Number(id)))
      .returning();
    
    if (result.length === 0) {
      return res.status(404).json({ message: "Integration not found" });
    }
    
    res.json({ message: "Integration deleted successfully" });
  } catch (error) {
    console.error("Error deleting integration:", error);
    res.status(500).json({ message: "Failed to delete integration" });
  }
});

// Test integration connection
router.post("/api/integrations/:id/test", async (req, res) => {
  try {
    const { id } = req.params;
    
    const integration = await db.select().from(integrations)
      .where(eq(integrations.id, Number(id)))
      .then(rows => rows[0]);
    
    if (!integration) {
      return res.status(404).json({ message: "Integration not found" });
    }
    
    // Mock connection test - in production this would make actual API calls
    const testResult = {
      success: true,
      message: "Connection successful",
      timestamp: new Date().toISOString(),
      details: {
        endpoint: integration.apiUrl,
        responseTime: Math.floor(Math.random() * 200) + 50 + "ms",
        status: "Connected"
      }
    };
    
    res.json(testResult);
  } catch (error) {
    console.error("Error testing integration:", error);
    res.status(500).json({ 
      success: false,
      message: "Connection test failed",
      error: String(error)
    });
  }
});

// Update integration status
router.patch("/api/integrations/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['ACTIVE', 'INACTIVE', 'ERROR'].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    
    const result = await db.update(integrations)
      .set({ 
        status,
        updatedAt: new Date(),
      })
      .where(eq(integrations.id, Number(id)))
      .returning();
    
    if (result.length === 0) {
      return res.status(404).json({ message: "Integration not found" });
    }
    
    res.json(result[0]);
  } catch (error) {
    console.error("Error updating integration status:", error);
    res.status(500).json({ message: "Failed to update integration status" });
  }
});

// Get integration data mapping
router.get("/api/integrations/:id/mapping", async (req, res) => {
  try {
    const { id } = req.params;
    
    const integration = await db.select().from(integrations)
      .where(eq(integrations.id, Number(id)))
      .then(rows => rows[0]);
    
    if (!integration) {
      return res.status(404).json({ message: "Integration not found" });
    }
    
    // Return data mapping from integration settings
    const settings = integration.settings as any || {};
    const mapping = settings.dataMapping || [];
    res.json(mapping);
  } catch (error) {
    console.error("Error fetching integration mapping:", error);
    res.status(500).json({ message: "Failed to fetch integration mapping" });
  }
});

// Update integration data mapping
router.put("/api/integrations/:id/mapping", async (req, res) => {
  try {
    const { id } = req.params;
    const { mappings } = req.body;
    
    // Validate mappings
    const validatedMappings = z.array(DataMappingSchema).parse(mappings);
    
    const integration = await db.select().from(integrations)
      .where(eq(integrations.id, Number(id)))
      .then(rows => rows[0]);
    
    if (!integration) {
      return res.status(404).json({ message: "Integration not found" });
    }
    
    // Update integration settings with new mapping
    const currentSettings = integration.settings as any || {};
    const updatedSettings = {
      ...currentSettings,
      dataMapping: validatedMappings
    };
    
    const result = await db.update(integrations)
      .set({ 
        settings: updatedSettings,
        updatedAt: new Date(),
      })
      .where(eq(integrations.id, Number(id)))
      .returning();
    
    res.json(result[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid mapping data", errors: error.errors });
    }
    console.error("Error updating integration mapping:", error);
    res.status(500).json({ message: "Failed to update integration mapping" });
  }
});

// Trigger manual sync
router.post("/api/integrations/:id/sync", async (req, res) => {
  try {
    const { id } = req.params;
    const { dataTypes } = req.body;
    
    const integration = await db.select().from(integrations)
      .where(eq(integrations.id, Number(id)))
      .then(rows => rows[0]);
    
    if (!integration) {
      return res.status(404).json({ message: "Integration not found" });
    }
    
    if (integration.status !== 'ACTIVE') {
      return res.status(400).json({ message: "Integration is not active" });
    }
    
    // Mock sync trigger - in production this would queue actual sync job
    const syncJob = {
      id: Date.now(),
      integrationId: Number(id),
      dataTypes: dataTypes || ['transactions', 'invoices'],
      status: 'PENDING',
      startedAt: new Date().toISOString(),
      estimatedDuration: '5-10 minutes'
    };
    
    res.json({
      message: "Sync job triggered successfully",
      job: syncJob
    });
  } catch (error) {
    console.error("Error triggering sync:", error);
    res.status(500).json({ message: "Failed to trigger sync" });
  }
});

// Get sync history
router.get("/api/integrations/:id/sync-history", async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 10, offset = 0 } = req.query;
    
    // Mock sync history - in production this would query sync_jobs table
    const history = Array.from({ length: Number(limit) }, (_, i) => ({
      id: Date.now() - i * 86400000,
      startedAt: new Date(Date.now() - i * 86400000).toISOString(),
      completedAt: new Date(Date.now() - i * 86400000 + 300000).toISOString(),
      status: i === 0 ? 'RUNNING' : 'COMPLETED',
      recordsProcessed: Math.floor(Math.random() * 100) + 10,
      dataTypes: ['transactions', 'invoices'],
      duration: '4m 32s'
    }));
    
    res.json({
      history,
      total: 50,
      limit: Number(limit),
      offset: Number(offset)
    });
  } catch (error) {
    console.error("Error fetching sync history:", error);
    res.status(500).json({ message: "Failed to fetch sync history" });
  }
});

export default router;