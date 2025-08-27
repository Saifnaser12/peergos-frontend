import { Router } from "express";
import { storage } from "../storage";
import { z } from "zod";
import crypto from "crypto";
import axios from "axios";

const router = Router();

// Schema for webhook configuration
const WebhookConfigSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  events: z.array(z.enum([
    'TRANSACTION_CREATED',
    'TRANSACTION_UPDATED',
    'INVOICE_CREATED',
    'INVOICE_SENT',
    'INVOICE_PAID',
    'VAT_RETURN_SUBMITTED',
    'CIT_RETURN_SUBMITTED',
    'PAYMENT_RECEIVED',
    'PAYMENT_SENT',
    'ACCOUNT_CREATED',
    'CUSTOMER_CREATED',
    'INTEGRATION_SYNC_COMPLETED',
    'COMPLIANCE_ALERT'
  ])),
  isActive: z.boolean().optional().default(true),
  secret: z.string().optional(),
  headers: z.record(z.string()).optional(),
  retryPolicy: z.object({
    maxRetries: z.number().min(0).max(10).optional().default(3),
    retryDelay: z.number().min(1000).max(300000).optional().default(5000),
    backoffMultiplier: z.number().min(1).max(5).optional().default(2)
  }).optional()
});

// Schema for webhook delivery
const WebhookDeliverySchema = z.object({
  webhookId: z.number(),
  event: z.string(),
  payload: z.record(z.any()),
  timestamp: z.date().optional().default(() => new Date())
});

// Get all webhooks for company
router.get("/", async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      return res.status(401).json({ message: "Company ID required" });
    }

    const webhooks = await storage.getWebhooks(companyId);
    res.json(webhooks);
  } catch (error) {
    console.error("Error fetching webhooks:", error);
    res.status(500).json({ message: "Failed to fetch webhooks" });
  }
});

// Create webhook
router.post("/", async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      return res.status(401).json({ message: "Company ID required" });
    }

    const validatedData = WebhookConfigSchema.parse(req.body);
    
    // Generate secret if not provided
    const secret = validatedData.secret || crypto.randomBytes(32).toString('hex');
    
    const webhook = await storage.createWebhook({
      ...validatedData,
      companyId,
      secret,
      createdAt: new Date(),
      lastTriggered: null
    });

    // Don't return the secret in response for security
    const { secret: _, ...webhookResponse } = webhook;
    res.status(201).json(webhookResponse);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid webhook configuration", errors: error.errors });
    }
    console.error("Error creating webhook:", error);
    res.status(500).json({ message: "Failed to create webhook" });
  }
});

// Update webhook
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;
    
    const validatedData = WebhookConfigSchema.partial().parse(req.body);
    
    const webhook = await storage.updateWebhook(Number(id), validatedData);
    if (!webhook || webhook.companyId !== companyId) {
      return res.status(404).json({ message: "Webhook not found" });
    }

    const { secret: _, ...webhookResponse } = webhook;
    res.json(webhookResponse);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid webhook configuration", errors: error.errors });
    }
    console.error("Error updating webhook:", error);
    res.status(500).json({ message: "Failed to update webhook" });
  }
});

// Delete webhook
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;
    
    const webhook = await storage.getWebhook(Number(id));
    if (!webhook || webhook.companyId !== companyId) {
      return res.status(404).json({ message: "Webhook not found" });
    }

    await storage.deleteWebhook(Number(id));
    res.json({ message: "Webhook deleted successfully" });
  } catch (error) {
    console.error("Error deleting webhook:", error);
    res.status(500).json({ message: "Failed to delete webhook" });
  }
});

// Test webhook
router.post("/:id/test", async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;
    
    const webhook = await storage.getWebhook(Number(id));
    if (!webhook || webhook.companyId !== companyId) {
      return res.status(404).json({ message: "Webhook not found" });
    }

    const testPayload = {
      event: 'TEST_EVENT',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook delivery',
        webhookId: webhook.id,
        companyId: webhook.companyId
      }
    };

    const deliveryResult = await deliverWebhook(webhook, testPayload);
    
    res.json({
      success: deliveryResult.success,
      statusCode: deliveryResult.statusCode,
      responseTime: deliveryResult.responseTime,
      error: deliveryResult.error
    });
  } catch (error) {
    console.error("Error testing webhook:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to test webhook",
      details: error.message 
    });
  }
});

// Get webhook delivery history
router.get("/:id/deliveries", async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;
    const { page = 1, limit = 20, status } = req.query;
    
    const webhook = await storage.getWebhook(Number(id));
    if (!webhook || webhook.companyId !== companyId) {
      return res.status(404).json({ message: "Webhook not found" });
    }

    const deliveries = await storage.getWebhookDeliveries(Number(id), {
      page: Number(page),
      limit: Number(limit),
      status: status as string
    });
    
    res.json(deliveries);
  } catch (error) {
    console.error("Error fetching webhook deliveries:", error);
    res.status(500).json({ message: "Failed to fetch webhook deliveries" });
  }
});

// Retry failed webhook delivery
router.post("/deliveries/:deliveryId/retry", async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const companyId = req.user?.companyId;
    
    const delivery = await storage.getWebhookDelivery(Number(deliveryId));
    if (!delivery) {
      return res.status(404).json({ message: "Webhook delivery not found" });
    }

    const webhook = await storage.getWebhook(delivery.webhookId);
    if (!webhook || webhook.companyId !== companyId) {
      return res.status(404).json({ message: "Webhook not found" });
    }

    if (delivery.status === 'SUCCESS') {
      return res.status(400).json({ message: "Cannot retry successful delivery" });
    }

    const retryResult = await deliverWebhook(webhook, delivery.payload);
    
    await storage.updateWebhookDelivery(Number(deliveryId), {
      status: retryResult.success ? 'SUCCESS' : 'FAILED',
      statusCode: retryResult.statusCode,
      responseTime: retryResult.responseTime,
      error: retryResult.error,
      retryCount: delivery.retryCount + 1,
      lastRetryAt: new Date()
    });

    res.json({
      success: retryResult.success,
      delivery: await storage.getWebhookDelivery(Number(deliveryId))
    });
  } catch (error) {
    console.error("Error retrying webhook delivery:", error);
    res.status(500).json({ message: "Failed to retry webhook delivery" });
  }
});

// Get available webhook events
router.get("/events", (req, res) => {
  const events = [
    {
      event: 'TRANSACTION_CREATED',
      description: 'Triggered when a new transaction is created',
      payload: {
        transactionId: 'number',
        amount: 'number',
        account: 'string',
        description: 'string',
        date: 'ISO string'
      }
    },
    {
      event: 'INVOICE_CREATED',
      description: 'Triggered when a new invoice is created',
      payload: {
        invoiceId: 'number',
        invoiceNumber: 'string',
        customerName: 'string',
        totalAmount: 'number',
        status: 'string'
      }
    },
    {
      event: 'INVOICE_PAID',
      description: 'Triggered when an invoice is marked as paid',
      payload: {
        invoiceId: 'number',
        invoiceNumber: 'string',
        paidAmount: 'number',
        paidDate: 'ISO string',
        paymentMethod: 'string'
      }
    },
    {
      event: 'VAT_RETURN_SUBMITTED',
      description: 'Triggered when a VAT return is submitted to FTA',
      payload: {
        returnId: 'number',
        period: 'string',
        totalVAT: 'number',
        submissionDate: 'ISO string',
        status: 'string'
      }
    },
    {
      event: 'PAYMENT_RECEIVED',
      description: 'Triggered when a payment is received',
      payload: {
        paymentId: 'number',
        amount: 'number',
        fromCustomer: 'string',
        method: 'string',
        date: 'ISO string'
      }
    },
    {
      event: 'COMPLIANCE_ALERT',
      description: 'Triggered when a compliance issue is detected',
      payload: {
        alertType: 'string',
        severity: 'string',
        message: 'string',
        relatedEntity: 'object',
        dueDate: 'ISO string'
      }
    }
  ];
  
  res.json(events);
});

// Webhook delivery function
export async function deliverWebhook(webhook: any, payload: any): Promise<{
  success: boolean;
  statusCode?: number;
  responseTime: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    // Create signature for payload verification
    const signature = createWebhookSignature(payload, webhook.secret);
    
    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': signature,
      'X-Webhook-Timestamp': Math.floor(Date.now() / 1000).toString(),
      'X-Webhook-ID': webhook.id.toString(),
      'User-Agent': 'Peergos-Webhooks/1.0',
      ...webhook.headers
    };

    // Make HTTP request
    const response = await axios.post(webhook.url, payload, {
      headers,
      timeout: 30000, // 30 second timeout
      validateStatus: (status) => status >= 200 && status < 300
    });

    const responseTime = Date.now() - startTime;

    // Update webhook last triggered time
    await storage.updateWebhook(webhook.id, {
      lastTriggered: new Date()
    });

    return {
      success: true,
      statusCode: response.status,
      responseTime
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    
    return {
      success: false,
      statusCode: error.response?.status,
      responseTime,
      error: error.message || 'Unknown error occurred'
    };
  }
}

// Webhook event trigger function
export async function triggerWebhook(companyId: number, event: string, data: any): Promise<void> {
  try {
    // Get all active webhooks for the company that listen to this event
    const webhooks = await storage.getWebhooksByEvent(companyId, event);
    
    if (webhooks.length === 0) {
      return; // No webhooks configured for this event
    }

    const payload = {
      event,
      timestamp: new Date().toISOString(),
      data
    };

    // Deliver to all matching webhooks
    for (const webhook of webhooks) {
      if (!webhook.isActive) continue;

      try {
        // Create delivery record
        const delivery = await storage.createWebhookDelivery({
          webhookId: webhook.id,
          event,
          payload,
          status: 'PENDING',
          createdAt: new Date()
        });

        // Attempt delivery
        const result = await deliverWebhook(webhook, payload);
        
        // Update delivery record
        await storage.updateWebhookDelivery(delivery.id, {
          status: result.success ? 'SUCCESS' : 'FAILED',
          statusCode: result.statusCode,
          responseTime: result.responseTime,
          error: result.error,
          deliveredAt: result.success ? new Date() : null
        });

        // Schedule retries for failed deliveries
        if (!result.success && webhook.retryPolicy) {
          scheduleWebhookRetry(delivery.id, webhook.retryPolicy);
        }
      } catch (error) {
        console.error(`Error delivering webhook ${webhook.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error triggering webhooks:', error);
  }
}

// Helper functions
function createWebhookSignature(payload: any, secret: string): string {
  const payloadString = JSON.stringify(payload);
  return crypto
    .createHmac('sha256', secret)
    .update(payloadString)
    .digest('hex');
}

function scheduleWebhookRetry(deliveryId: number, retryPolicy: any): void {
  // In a real implementation, this would use a job queue like Bull or similar
  // For now, we'll use setTimeout as a simple implementation
  
  setTimeout(async () => {
    try {
      const delivery = await storage.getWebhookDelivery(deliveryId);
      if (!delivery || delivery.status === 'SUCCESS' || delivery.retryCount >= retryPolicy.maxRetries) {
        return;
      }

      const webhook = await storage.getWebhook(delivery.webhookId);
      if (!webhook || !webhook.isActive) {
        return;
      }

      const result = await deliverWebhook(webhook, delivery.payload);
      
      await storage.updateWebhookDelivery(deliveryId, {
        status: result.success ? 'SUCCESS' : 'FAILED',
        statusCode: result.statusCode,
        responseTime: result.responseTime,
        error: result.error,
        retryCount: delivery.retryCount + 1,
        lastRetryAt: new Date(),
        deliveredAt: result.success ? new Date() : null
      });

      // Schedule next retry if still failing
      if (!result.success && delivery.retryCount + 1 < retryPolicy.maxRetries) {
        const nextDelay = retryPolicy.retryDelay * Math.pow(retryPolicy.backoffMultiplier, delivery.retryCount + 1);
        scheduleWebhookRetry(deliveryId, retryPolicy);
      }
    } catch (error) {
      console.error('Error in webhook retry:', error);
    }
  }, retryPolicy.retryDelay);
}

export default router;