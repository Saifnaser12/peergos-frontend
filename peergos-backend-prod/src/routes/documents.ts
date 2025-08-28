import { Router } from 'express';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { pgTable, text, serial, integer, timestamp, varchar } from 'drizzle-orm/pg-core';

// Documents table
const documents = pgTable('documents', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').notNull(),
  name: text('name').notNull(),
  type: varchar('type', { length: 50 }).notNull(), // PDF, XLSX, DOC, etc.
  url: text('url').notNull(),
  size: integer('size'),
  uploadedBy: integer('uploaded_by').notNull(),
  uploadedAt: timestamp('uploaded_at').defaultNow(),
  tags: text('tags').array(),
  category: varchar('category', { length: 100 }), // INVOICE, RECEIPT, TAX_DOCUMENT, etc.
});

const router = Router();

// Get all documents for a company
router.get('/api/documents', async (req, res) => {
  try {
    const companyId = req.session?.companyId || 1;
    const documentsList = await db.select().from(documents)
      .where(eq(documents.companyId, companyId));
    
    res.json(documentsList);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Upload a new document
router.post('/api/documents', async (req, res) => {
  try {
    const { name, type, url, size, tags, category } = req.body;
    const companyId = req.session?.companyId || 1;
    const uploadedBy = req.session?.userId || 1;

    const result = await db.insert(documents)
      .values({
        name,
        type,
        url,
        size,
        tags,
        category,
        companyId,
        uploadedBy,
      })
      .returning();

    res.status(201).json(result[0]);
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(400).json({ error: 'Failed to upload document' });
  }
});

// Get document by ID
router.get('/api/documents/:id', async (req, res) => {
  try {
    const documentId = parseInt(req.params.id);
    const companyId = req.session?.companyId || 1;
    
    const document = await db.select().from(documents)
      .where(eq(documents.id, documentId))
      .then(rows => rows[0]);

    if (!document || document.companyId !== companyId) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// Delete document
router.delete('/api/documents/:id', async (req, res) => {
  try {
    const documentId = parseInt(req.params.id);
    const companyId = req.session?.companyId || 1;
    
    // Verify document belongs to company
    const document = await db.select().from(documents)
      .where(eq(documents.id, documentId))
      .then(rows => rows[0]);

    if (!document || document.companyId !== companyId) {
      return res.status(404).json({ error: 'Document not found' });
    }

    await db.delete(documents).where(eq(documents.id, documentId));
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

export default router;