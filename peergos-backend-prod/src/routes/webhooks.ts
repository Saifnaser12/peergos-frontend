import { Router } from "express";
import { db } from "../db";
import { webhooks, webhookDeliveries, insertWebhookSchema, insertWebhookDeliverySchema } from "../db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import crypto from "crypto";
import axios from "axios";

const router = Router();

// Get all webhooks for company
router.get("/api/webhooks", async (req, res) => {
  try {
    const companyId = req.session?.companyId || 1;
    
    const webhooksList = await db.select().from(webhooks)
      .where(eq(webhooks.companyId, companyId));
    
    // Don't return secrets in response
    const sanitizedWebhooks = webhooksList.map(({ secret, ...webhook }) => webhook);
    
    res.json(sanitizedWebhooks);
  } catch (error) {
    console.error("Error fetching webhooks:", error);
    res.status(500).json({ message: "Failed to fetch webhooks" });
  }
});

// Create webhook
router.post("/api/webhooks", async (req, res) => {
  try {
    const companyId = req.session?.companyId || 1;
    
    const validatedData = insertWebhookSchema.parse(req.body);
    
    // Generate secret if not provided
    const secret = validatedData.secret || crypto.randomBytes(32).toString('hex');
    
    const result = await db.insert(webhooks)
      .values({
        ...validatedData,
        companyId,
        secret,
        lastTriggered: null
      })
      .returning();

    // Don't return the secret in response for security
    const { secret: _, ...webhookResponse } = result[0];
    res.status(201).json(webhookResponse);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    console.error("Error creating webhook:", error);
    res.status(500).json({ message: "Failed to create webhook" });
  }
});

// Update webhook
router.put("/api/webhooks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.session?.companyId || 1;
    
    const validatedData = insertWebhookSchema.partial().parse(req.body);
    
    const result = await db.update(webhooks)
      .set(validatedData)
      .where(eq(webhooks.id, Number(id)))
      .returning();
    
    if (result.length === 0) {
      return res.status(404).json({ message: "Webhook not found" });
    }
    
    const { secret: _, ...webhookResponse } = result[0];
    res.json(webhookResponse);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    console.error("Error updating webhook:", error);
    res.status(500).json({ message: "Failed to update webhook" });
  }
});

// Delete webhook
router.delete("/api/webhooks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.session?.companyId || 1;
    
    const result = await db.delete(webhooks)
      .where(eq(webhooks.id, Number(id)))
      .returning();
    
    if (result.length === 0) {
      return res.status(404).json({ message: "Webhook not found" });
    }
    
    res.json({ message: "Webhook deleted successfully" });
  } catch (error) {
    console.error("Error deleting webhook:", error);
    res.status(500).json({ message: "Failed to delete webhook" });
  }
});

// Test webhook
router.post("/api/webhooks/:id/test", async (req, res) => {
  try {
    const { id } = req.params;
    
    const webhook = await db.select().from(webhooks)
      .where(eq(webhooks.id, Number(id)))
      .then(rows => rows[0]);
    
    if (!webhook) {
      return res.status(404).json({ message: "Webhook not found" });
    }
    
    const testPayload = {
      event: 'WEBHOOK_TEST',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook delivery',
        webhookId: webhook.id,
        companyId: webhook.companyId
      }
    };
    
    try {
      const response = await axios.post(webhook.url, testPayload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': generateSignature(testPayload, webhook.secret),
          ...webhook.headers
        },
        timeout: 10000
      });
      
      res.json({
        success: true,
        message: 'Webhook test successful',
        response: {
          status: response.status,
          statusText: response.statusText,
          responseTime: `${Date.now()}ms`
        }
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: 'Webhook test failed',
        error: {
          message: error.message,
          code: error.code,
          status: error.response?.status
        }
      });
    }
  } catch (error) {
    console.error("Error testing webhook:", error);
    res.status(500).json({ message: "Failed to test webhook" });
  }
});

// Get webhook delivery history
router.get("/api/webhooks/:id/deliveries", async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const deliveries = await db.select().from(webhookDeliveries)
      .where(eq(webhookDeliveries.webhookId, Number(id)))
      .limit(Number(limit))
      .offset(Number(offset));
    
    res.json(deliveries);
  } catch (error) {
    console.error("Error fetching webhook deliveries:", error);
    res.status(500).json({ message: "Failed to fetch webhook deliveries" });
  }
});

// Retry webhook delivery
router.post("/api/webhooks/deliveries/:deliveryId/retry", async (req, res) => {
  try {
    const { deliveryId } = req.params;
    
    const delivery = await db.select().from(webhookDeliveries)
      .where(eq(webhookDeliveries.id, Number(deliveryId)))
      .then(rows => rows[0]);
    
    if (!delivery) {
      return res.status(404).json({ message: "Delivery not found" });
    }
    
    const webhook = await db.select().from(webhooks)
      .where(eq(webhooks.id, delivery.webhookId))
      .then(rows => rows[0]);
    
    if (!webhook) {
      return res.status(404).json({ message: "Webhook not found" });
    }
    
    // Create new delivery record for retry
    const retryDelivery = await deliverWebhook(webhook, delivery.event, delivery.payload);
    
    res.json({
      message: 'Webhook delivery retried',
      delivery: retryDelivery
    });
  } catch (error) {
    console.error("Error retrying webhook delivery:", error);
    res.status(500).json({ message: "Failed to retry webhook delivery" });
  }
});

// Get available webhook events
router.get("/api/webhooks/events", (req, res) => {
  const events = [
    {
      event: 'TRANSACTION_CREATED',
      description: 'Triggered when a new transaction is created',
      payload: { transactionId: 'number', amount: 'number', type: 'string' }
    },
    {
      event: 'TRANSACTION_UPDATED',
      description: 'Triggered when a transaction is updated',
      payload: { transactionId: 'number', changes: 'object' }
    },
    {
      event: 'INVOICE_CREATED',
      description: 'Triggered when a new invoice is created',
      payload: { invoiceId: 'number', invoiceNumber: 'string', total: 'number' }
    },
    {
      event: 'INVOICE_SENT',
      description: 'Triggered when an invoice is sent to a client',
      payload: { invoiceId: 'number', clientEmail: 'string' }
    },
    {
      event: 'INVOICE_PAID',
      description: 'Triggered when an invoice is marked as paid',
      payload: { invoiceId: 'number', paidAmount: 'number', paidDate: 'string' }
    },
    {
      event: 'VAT_RETURN_SUBMITTED',
      description: 'Triggered when a VAT return is submitted',
      payload: { filingId: 'number', period: 'string', totalVAT: 'number' }
    },
    {
      event: 'CIT_RETURN_SUBMITTED',
      description: 'Triggered when a CIT return is submitted',
      payload: { filingId: 'number', taxYear: 'string', totalCIT: 'number' }
    },
    {
      event: 'COMPLIANCE_ALERT',
      description: 'Triggered when compliance issues are detected',
      payload: { alertType: 'string', severity: 'string', message: 'string' }
    }
  ];
  
  res.json(events);
});

// Helper function to generate webhook signature
function generateSignature(payload: any, secret: string): string {
  const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return crypto.createHmac('sha256', secret).update(payloadString).digest('hex');
}

// Helper function to deliver webhook
async function deliverWebhook(webhook: any, event: string, payload: any) {
  const delivery = {
    webhookId: webhook.id,
    event,
    payload,
    retryCount: 0,
    status: 'PENDING' as const,
    createdAt: new Date(),
  };
  
  try {
    const signature = generateSignature(payload, webhook.secret);
    
    const response = await axios.post(webhook.url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': event,
        ...webhook.headers
      },
      timeout: 30000
    });
    
    const result = await db.insert(webhookDeliveries)
      .values({
        ...delivery,
        responseStatus: response.status,
        responseBody: response.data ? JSON.stringify(response.data) : null,
        status: 'DELIVERED',
        deliveredAt: new Date(),
      })
      .returning();
    
    return result[0];
  } catch (error: any) {
    const result = await db.insert(webhookDeliveries)
      .values({
        ...delivery,
        responseStatus: error.response?.status || 0,
        responseBody: error.message,
        status: 'FAILED',
      })
      .returning();
    
    return result[0];
  }
}

// Helper function to trigger webhook (for use by other parts of the application)
export async function triggerWebhook(companyId: number, event: string, payload: any) {
  try {
    const companyWebhooks = await db.select().from(webhooks)
      .where(eq(webhooks.companyId, companyId));
    
    const applicableWebhooks = companyWebhooks.filter(webhook => 
      webhook.isActive && webhook.events.includes(event)
    );
    
    const deliveries = await Promise.allSettled(
      applicableWebhooks.map(webhook => deliverWebhook(webhook, event, payload))
    );
    
    return deliveries;
  } catch (error) {
    console.error('Error triggering webhooks:', error);
    return [];
  }
}

export default router;