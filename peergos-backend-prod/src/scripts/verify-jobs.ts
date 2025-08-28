#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

/**
 * Verify background jobs and schedulers
 */
function verifyJobs(): boolean {
  console.log('⏰ Verifying background jobs implementation...');
  
  try {
    // Check for notification scheduler
    const schedulerFile = path.join(__dirname, '../services/notification-scheduler.ts');
    const schedulerExists = fs.existsSync(schedulerFile);
    
    if (schedulerExists) {
      console.log('   ✅ Notification scheduler: Found');
      
      const schedulerContent = fs.readFileSync(schedulerFile, 'utf-8');
      
      // Check for cron patterns
      const cronPatterns = [
        'node-cron',
        'schedule',
        'cron'
      ];
      
      let cronSupport = false;
      cronPatterns.forEach(pattern => {
        if (schedulerContent.includes(pattern)) {
          console.log(`   ✅ Cron support (${pattern}): Found`);
          cronSupport = true;
        }
      });
      
      if (!cronSupport) {
        console.log('   ❌ Cron support: Missing');
      }
      
    } else {
      console.log('   ❌ Notification scheduler: Missing');
    }
    
    // Check for server initialization
    const serverFile = path.join(__dirname, '../server.ts');
    if (fs.existsSync(serverFile)) {
      const serverContent = fs.readFileSync(serverFile, 'utf-8');
      
      const schedulerInit = serverContent.includes('notification') || 
                           serverContent.includes('scheduler') ||
                           serverContent.includes('cron');
      
      console.log(`   ${schedulerInit ? '✅' : '❌'} Scheduler initialization: ${schedulerInit ? 'Found' : 'Missing'}`);
    }
    
    // Check for background job patterns
    const jobPatterns = [
      'compliance check',
      'tax deadline',
      'notification'
    ];
    
    let jobsFound = 0;
    if (schedulerExists) {
      const schedulerContent = fs.readFileSync(schedulerFile, 'utf-8');
      
      jobPatterns.forEach(pattern => {
        if (schedulerContent.toLowerCase().includes(pattern)) {
          console.log(`   ✅ Background job '${pattern}': Found`);
          jobsFound++;
        }
      });
    }
    
    const jobScore = jobsFound / jobPatterns.length;
    const schedulerScore = schedulerExists ? 1 : 0;
    const totalScore = (jobScore + schedulerScore) / 2;
    
    const passed = totalScore >= 0.6; // 60% threshold
    
    console.log(`\n📊 Background jobs coverage: ${Math.round(totalScore * 100)}%`);
    console.log(`${passed ? '✅' : '❌'} Jobs verification: ${passed ? 'PASS' : 'FAIL'}`);
    
    return passed;
    
  } catch (error) {
    console.error('❌ Jobs verification failed:', error);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  const passed = verifyJobs();
  process.exit(passed ? 0 : 1);
}

export { verifyJobs };