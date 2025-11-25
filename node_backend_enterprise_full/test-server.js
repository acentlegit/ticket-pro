#!/usr/bin/env node

// Simple test to check if server can start without import errors
import dotenv from 'dotenv';
dotenv.config();

console.log('Testing server imports...');

try {
  // Test importing routes
  console.log('✓ Testing auth routes import...');
  await import('./src/routes/auth.js');
  
  console.log('✓ Testing tickets routes import...');
  await import('./src/routes/tickets.js');
  
  console.log('✓ Testing health routes import...');
  await import('./src/routes/health.js');
  
  console.log('✅ All imports successful!');
  console.log('Server should start without import errors.');
  
} catch (error) {
  console.error('❌ Import error:', error.message);
  console.error('Full error:', error);
  process.exit(1);
}