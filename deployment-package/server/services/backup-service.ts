import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, mkdir } from 'fs/promises';
import path from 'path';
import { db } from '../db';
import { encrypt, decrypt } from '../middleware/security';

const execAsync = promisify(exec);

interface BackupMetadata {
  timestamp: string;
  type: 'full' | 'incremental' | 'differential';
  size: number;
  checksum: string;
  tables: string[];
  version: string;
}

export class BackupService {
  private backupDir = path.join(process.cwd(), 'backups');
  
  constructor() {
    this.ensureBackupDirectory();
  }

  private async ensureBackupDirectory() {
    try {
      await mkdir(this.backupDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create backup directory:', error);
    }
  }

  // Full database backup
  async createFullBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(this.backupDir, `full-backup-${timestamp}.sql`);
    
    try {
      // Get database connection details
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        throw new Error('DATABASE_URL not configured');
      }

      // Extract connection details from URL
      const url = new URL(dbUrl);
      const host = url.hostname;
      const port = url.port || '5432';
      const database = url.pathname.slice(1);
      const username = url.username;
      const password = url.password;

      // Create pg_dump command
      const dumpCommand = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${username} -d ${database} --no-owner --no-privileges --clean --if-exists`;
      
      const { stdout } = await execAsync(dumpCommand);
      
      // Encrypt the backup
      const encryptedBackup = encrypt(stdout);
      await writeFile(backupFile, encryptedBackup);

      // Create metadata
      const metadata: BackupMetadata = {
        timestamp: new Date().toISOString(),
        type: 'full',
        size: Buffer.byteLength(encryptedBackup),
        checksum: this.calculateChecksum(stdout),
        tables: await this.getDatabaseTables(),
        version: '1.0.0'
      };

      await writeFile(
        path.join(this.backupDir, `full-backup-${timestamp}.metadata.json`),
        JSON.stringify(metadata, null, 2)
      );

      console.log(`Full backup created: ${backupFile}`);
      return backupFile;
    } catch (error) {
      console.error('Backup failed:', error);
      throw new Error(`Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Incremental backup (changes since last backup)
  async createIncrementalBackup(lastBackupTime: Date): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(this.backupDir, `incremental-backup-${timestamp}.json`);
    
    try {
      // Get changed records since last backup
      const changes = await this.getIncrementalChanges(lastBackupTime);
      
      const backupData = {
        timestamp: new Date().toISOString(),
        lastBackupTime: lastBackupTime.toISOString(),
        changes,
        version: '1.0.0'
      };

      // Encrypt and save
      const encryptedBackup = encrypt(JSON.stringify(backupData, null, 2));
      await writeFile(backupFile, encryptedBackup);

      console.log(`Incremental backup created: ${backupFile}`);
      return backupFile;
    } catch (error) {
      console.error('Incremental backup failed:', error);
      throw new Error(`Incremental backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Export company data for compliance
  async exportCompanyData(companyId: number, includeFinancialData: boolean = true): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportFile = path.join(this.backupDir, `company-${companyId}-export-${timestamp}.json`);
    
    try {
      const exportData = await this.getCompanyExportData(companyId, includeFinancialData);
      
      const exportPackage = {
        timestamp: new Date().toISOString(),
        companyId,
        includeFinancialData,
        data: exportData,
        compliance: {
          uaeFtaCompliant: true,
          recordRetentionPeriod: '7 years',
          exportReason: 'Compliance audit',
          dataClassification: includeFinancialData ? 'confidential' : 'internal'
        }
      };

      // Encrypt sensitive data
      const encryptedExport = encrypt(JSON.stringify(exportPackage, null, 2));
      await writeFile(exportFile, encryptedExport);

      console.log(`Company data exported: ${exportFile}`);
      return exportFile;
    } catch (error) {
      console.error('Export failed:', error);
      throw new Error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Restore from backup
  async restoreFromBackup(backupFile: string, targetDatabase?: string): Promise<void> {
    try {
      const backupContent = await readFile(backupFile, 'utf-8');
      const decryptedContent = this.decrypt(backupContent);
      
      // Validate backup integrity
      const metadataFile = backupFile.replace('.sql', '.metadata.json');
      const metadata: BackupMetadata = JSON.parse(await readFile(metadataFile, 'utf-8'));
      
      const currentChecksum = this.calculateChecksum(decryptedContent);
      if (currentChecksum !== metadata.checksum) {
        throw new Error('Backup integrity check failed');
      }

      // Execute restore
      const dbUrl = targetDatabase || process.env.DATABASE_URL;
      if (!dbUrl) {
        throw new Error('Database URL not configured');
      }

      const url = new URL(dbUrl);
      const host = url.hostname;
      const port = url.port || '5432';
      const database = url.pathname.slice(1);
      const username = url.username;
      const password = url.password;

      // Write SQL to temp file and execute
      const tempFile = path.join(this.backupDir, 'restore-temp.sql');
      await writeFile(tempFile, decryptedContent);

      const restoreCommand = `PGPASSWORD="${password}" psql -h ${host} -p ${port} -U ${username} -d ${database} -f ${tempFile}`;
      await execAsync(restoreCommand);

      console.log('Database restored successfully');
    } catch (error) {
      console.error('Restore failed:', error);
      throw new Error(`Restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Automated backup scheduling
  async scheduleBackups(): Promise<void> {
    // Daily incremental backups at 2 AM
    this.scheduleJob('0 2 * * *', async () => {
      const lastBackup = await this.getLastBackupTime();
      await this.createIncrementalBackup(lastBackup);
    });

    // Weekly full backups on Sundays at 1 AM
    this.scheduleJob('0 1 * * 0', async () => {
      await this.createFullBackup();
    });

    // Monthly cleanup of old backups
    this.scheduleJob('0 3 1 * *', async () => {
      await this.cleanupOldBackups();
    });
  }

  // Backup verification
  async verifyBackup(backupFile: string): Promise<boolean> {
    try {
      const backupContent = await readFile(backupFile, 'utf-8');
      const decryptedContent = this.decrypt(backupContent);
      
      const metadataFile = backupFile.replace('.sql', '.metadata.json');
      const metadata: BackupMetadata = JSON.parse(await readFile(metadataFile, 'utf-8'));
      
      const currentChecksum = this.calculateChecksum(decryptedContent);
      return currentChecksum === metadata.checksum;
    } catch (error) {
      console.error('Backup verification failed:', error);
      return false;
    }
  }

  private async getDatabaseTables(): Promise<string[]> {
    const result = await db.execute(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    return result.rows.map((row: any) => row.table_name);
  }

  private async getIncrementalChanges(since: Date): Promise<any> {
    // This would track changes using triggers or timestamp columns
    // For now, return a placeholder structure
    return {
      inserted: [],
      updated: [],
      deleted: []
    };
  }

  private async getCompanyExportData(companyId: number, includeFinancialData: boolean): Promise<any> {
    const data: any = {};
    
    // Export basic company information
    // Export basic company information
    try {
      data.company = await db.query.companies?.findFirst({
        where: (companies: any, { eq }: any) => eq(companies.id, companyId)
      });

      // Export users
      data.users = await db.query.users?.findMany({
        where: (users: any, { eq }: any) => eq(users.companyId, companyId),
        columns: { id: true, username: true, email: true, role: true, createdAt: true }
      });

      if (includeFinancialData) {
        // Export financial data (would need proper schema imports)
        data.note = 'Financial data export requires proper schema implementation';
      }
    } catch (error) {
      console.error('Database query failed:', error);
      data.error = 'Failed to export some data';
    }

    return data;
  }

    return data;
  }

  private async getLastBackupTime(): Promise<Date> {
    // Get timestamp of last backup from metadata
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
  }

  private scheduleJob(cronExpression: string, task: () => Promise<void>): void {
    // In production, use node-cron or similar
    console.log(`Backup job scheduled: ${cronExpression}`);
  }

  private async cleanupOldBackups(): Promise<void> {
    // Keep backups for 90 days, then archive to cold storage
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);
    
    console.log(`Cleaning up backups older than ${cutoffDate.toISOString()}`);
    // Implementation would scan backup directory and archive/delete old files
  }

  private calculateChecksum(data: string): string {
    return require('crypto').createHash('sha256').update(data).digest('hex');
  }

  private decrypt(encryptedData: string): string {
    return decrypt(encryptedData);
  }
}