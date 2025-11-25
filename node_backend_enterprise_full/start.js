#!/usr/bin/env node

import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check for .env file
const envPath = join(__dirname, '.env');
if (!existsSync(envPath)) {
  console.error('❌ Error: .env file not found!');
  console.log('📝 Please create a .env file by copying .env.example:');
  console.log('   cp .env.example .env');
  console.log('');
  console.log('📋 Or create .env with minimum required variables:');
  console.log('   MONGO_URI=mongodb://localhost:27017/enterprise');
  console.log('   JWT_SECRET=your_secret_key_here');
  console.log('   PORT=4000');
  process.exit(1);
}

// Load and check environment variables
import dotenv from 'dotenv';
const result = dotenv.config();

if (result.error) {
  console.error('❌ Error loading .env file:', result.error.message);
  process.exit(1);
}

console.log('📋 Environment variables loaded from .env');

if (!process.env.MONGO_URI) {
  console.error('❌ Error: MONGO_URI not set in .env file!');
  console.log('📝 Please add MONGO_URI to your .env file:');
  console.log('   MONGO_URI=mongodb://localhost:27017/enterprise');
  process.exit(1);
}

console.log(`✅ MONGO_URI is set: ${process.env.MONGO_URI}`);

if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'changeme_with_secure_random_string') {
  console.warn('⚠️  Warning: JWT_SECRET is not set or using default value');
  console.log('📝 Please update JWT_SECRET in your .env file for security');
}

console.log('✅ Environment configuration looks good!');
console.log('🚀 Starting server...');
console.log('');

// Import and start the main server
import('./server.js').catch(error => {
  console.error('❌ Failed to start server:', error.message);
  process.exit(1);
});