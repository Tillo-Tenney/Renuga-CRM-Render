#!/usr/bin/env node
/**
 * Post-build script to inject runtime configuration
 * This replaces the placeholder in config.js with the actual API URL
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const configPath = join(__dirname, 'dist', 'config.js');

// Placeholder constant must match the one in src/services/api.ts
const API_URL_PLACEHOLDER = '__VITE_API_URL__';

try {
  // Check if config file exists
  if (!existsSync(configPath)) {
    console.error('❌ Error: config.js not found in dist folder');
    console.error('   Make sure public/config.js exists and is copied during build');
    process.exit(1);
  }

  // Read the config file
  let configContent = readFileSync(configPath, 'utf-8');
  
  // Get API URL from environment variable
  const apiUrl = process.env.VITE_API_URL || '';
  
  // Replace placeholder with actual URL
  if (apiUrl) {
    configContent = configContent.replace(API_URL_PLACEHOLDER, apiUrl);
    console.log(`✓ Injected API URL: ${apiUrl}`);
  } else {
    console.log('⚠ Warning: VITE_API_URL not set, keeping placeholder');
    console.log('   The app will fall back to localhost or use runtime config');
  }
  
  // Write back the modified config
  writeFileSync(configPath, configContent, 'utf-8');
  console.log('✓ Runtime config updated successfully');
} catch (error) {
  console.error('❌ Error updating runtime config:', error);
  // Fail the build for critical errors like file write failures
  if (error.code === 'EACCES' || error.code === 'ENOENT') {
    console.error('   This is a critical error that will cause deployment issues');
    process.exit(1);
  }
  // For other errors, log but don't fail the build
  console.log('   Continuing with build...');
  process.exit(0);
}
