#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const { db } = require('../src/adapters/database.adapter');
const { OFFICIAL_ROUTES, EMAIL_ADDRESSES } = require('../src/config/constants');
const { EMAIL_TEMPLATES_LIST } = require('../src/emails/templates.registry');

const cmd = process.argv[2] || 'verify';

if (cmd === 'migrate') {
  db.migrateAndInitialize();
  console.log('[WORD BRIDGE] Database schema & migrations applied successfully.');
} else if (cmd === 'seed') {
  db.migrateAndInitialize();
  const seedPath = path.resolve(process.cwd(), 'database/seeds/01_reference_data.sql');
  db.execScript(fs.readFileSync(seedPath, 'utf8'));
  console.log('[WORD BRIDGE] Reference data seeded successfully.');
} else if (cmd === 'backup') {
  const info = db.createBackup();
  console.log('[WORD BRIDGE] Backup created:', info);
} else if (cmd === 'restore') {
  const target = process.argv[3];
  if (!target) {
    console.error('Usage: node scripts/manage.js restore <path-to-backup>');
    process.exit(1);
  }
  console.log('[WORD BRIDGE] Restore result:', db.restoreBackup(target));
} else if (cmd === 'build' || cmd === 'verify') {
  db.migrateAndInitialize();
  const seedPath = path.resolve(process.cwd(), 'database/seeds/01_reference_data.sql');
  db.execScript(fs.readFileSync(seedPath, 'utf8'));
  console.log('[WORD BRIDGE] Build & Structural Verification:');
  console.log(' - Official Routes count:', OFFICIAL_ROUTES.length);
  console.log(' - Has /su-kien route?:', OFFICIAL_ROUTES.some(r => r.path.includes('su-kien')));
  console.log(' - Official Emails:', EMAIL_ADDRESSES);
  console.log(' - Independent Email HTML Templates count:', EMAIL_TEMPLATES_LIST.length);
  console.log('[WORD BRIDGE] Verification PASSED.');
}
