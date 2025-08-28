#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

interface TableSchema {
  name: string;
  columns: string[];
}

interface EnumSchema {
  name: string;
  values: string[];
}

interface ReferenceSchemas {
  tables: TableSchema[];
  enums: EnumSchema[];
}

/**
 * Verify database schemas match reference
 */
function verifySchemas(): boolean {
  console.log('🗄️ Verifying database schema parity...');
  
  try {
    // Read reference schemas
    const referenceSchemasPath = path.join(__dirname, 'REFERENCE_SCHEMAS.json');
    const referenceSchemas: ReferenceSchemas = JSON.parse(fs.readFileSync(referenceSchemasPath, 'utf-8'));
    
    // Read actual schema file
    const schemaFile = path.join(__dirname, '../db/schema.ts');
    const schemaContent = fs.readFileSync(schemaFile, 'utf-8');
    
    let allPassed = true;
    
    // Verify tables
    console.log('📋 Checking tables...');
    for (const refTable of referenceSchemas.tables) {
      const tableRegex = new RegExp(`export const ${refTable.name}.*=.*pgTable`);
      const tableFound = tableRegex.test(schemaContent);
      
      if (tableFound) {
        console.log(`   ✅ ${refTable.name}: Found`);
        
        // Check critical columns exist
        const missingColumns = refTable.columns.filter(col => {
          const colRegex = new RegExp(`${col}:`);
          return !colRegex.test(schemaContent);
        });
        
        if (missingColumns.length > 0) {
          console.log(`      ⚠️  Missing columns: ${missingColumns.join(', ')}`);
          allPassed = false;
        }
      } else {
        console.log(`   ❌ ${refTable.name}: Missing`);
        allPassed = false;
      }
    }
    
    // Verify enums
    console.log('\n🏷️ Checking enums...');
    for (const refEnum of referenceSchemas.enums) {
      const enumRegex = new RegExp(`export const ${refEnum.name}.*=.*pgEnum`);
      const enumFound = enumRegex.test(schemaContent);
      
      if (enumFound) {
        console.log(`   ✅ ${refEnum.name}: Found`);
        
        // Check enum values
        const missingValues = refEnum.values.filter(val => {
          const valRegex = new RegExp(`["']${val}["']`);
          return !valRegex.test(schemaContent);
        });
        
        if (missingValues.length > 0) {
          console.log(`      ⚠️  Missing values: ${missingValues.join(', ')}`);
          allPassed = false;
        }
      } else {
        console.log(`   ❌ ${refEnum.name}: Missing`);
        allPassed = false;
      }
    }
    
    console.log(`\n${allPassed ? '✅' : '❌'} Schema verification: ${allPassed ? 'PASS' : 'FAIL'}`);
    
    return allPassed;
    
  } catch (error) {
    console.error('❌ Schema verification failed:', error);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  const passed = verifySchemas();
  process.exit(passed ? 0 : 1);
}

export { verifySchemas };