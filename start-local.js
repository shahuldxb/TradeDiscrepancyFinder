#!/usr/bin/env node

/**
 * Local Development Startup Script
 * 
 * This script properly configures the environment for local development
 * and starts the server on the correct port configuration.
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Set local development environment variables
process.env.NODE_ENV = 'development';
process.env.REPLIT_DOMAINS = process.env.REPLIT_DOMAINS || 'localhost:5000,127.0.0.1:5000';

console.log('🚀 Starting Trade Finance Platform in Local Development Mode...');
console.log('📍 Frontend & Backend will both run on: http://localhost:5000');
console.log('🔧 Environment: Local Development (Authentication Bypass Enabled)');

// Start the main server
const serverProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname,
  env: {
    ...process.env,
    NODE_ENV: 'development',
    REPLIT_DOMAINS: 'localhost:5000,127.0.0.1:5000'
  }
});

serverProcess.on('error', (error) => {
  console.error('❌ Failed to start server:', error.message);
  process.exit(1);
});

serverProcess.on('close', (code) => {
  if (code !== 0) {
    console.error(`❌ Server process exited with code ${code}`);
    process.exit(code);
  }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Trade Finance Platform...');
  serverProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down Trade Finance Platform...');
  serverProcess.kill('SIGTERM');
  process.exit(0);
});