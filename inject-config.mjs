#!/usr/bin/env node
/**
 * Post-build script to inject runtime configuration
 * This replaces the placeholder in config.js with the actual API URL
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const configPath = join(__dirname, 'dist', 'config.js');

try {
  // Read the config file
  let configContent = readFileSync(configPath, 'utf-8');
  
  // Get API URL from environment variable
  const apiUrl = process.env.VITE_API_URL || '';
  
  // Replace placeholder with actual URL
  if (apiUrl) {
    configContent = configContent.replace('__VITE_API_URL__', apiUrl);
    console.log(`✓ Injected API URL: ${apiUrl}`);
  } else {
    console.log('⚠ Warning: VITE_API_URL not set, keeping placeholder');
  }
  
  // Write back the modified config
  writeFileSync(configPath, configContent, 'utf-8');
  console.log('✓ Runtime config updated successfully');
} catch (error) {
  console.error('Error updating runtime config:', error);
  // Don't fail the build if this script fails
  process.exit(0);
}
