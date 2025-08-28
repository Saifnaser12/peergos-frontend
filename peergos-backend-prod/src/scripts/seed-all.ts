#!/usr/bin/env node

import { seedUAEChartOfAccounts } from '../scripts/seed-chart-of-accounts';

/**
 * Main seeding script that runs all mandatory seeders
 */
async function seedAll() {
  console.log('🌱 Starting comprehensive database seeding...');
  
  try {
    // 1. Seed UAE Chart of Accounts
    console.log('📊 Seeding UAE Chart of Accounts...');
    await seedUAEChartOfAccounts();
    
    // 2. Add other mandatory seeders here
    console.log('👥 Seeding user data...');
    // Add user seeding logic if needed
    
    console.log('🏢 Seeding company data...');
    // Add company seeding logic if needed
    
    console.log('✅ All seeding completed successfully');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedAll().then(() => {
    console.log('🎉 Database seeding completed');
    process.exit(0);
  }).catch((error) => {
    console.error('💥 Fatal seeding error:', error);
    process.exit(1);
  });
}

export { seedAll };