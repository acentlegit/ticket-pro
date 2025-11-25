#!/usr/bin/env node

// Test MongoDB connection
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

console.log('🔍 Testing MongoDB connection...');
console.log(`MONGO_URI: ${process.env.MONGO_URI || 'NOT SET'}`);

if (!process.env.MONGO_URI) {
  console.error('❌ MONGO_URI not set in environment variables');
  process.exit(1);
}

try {
  // Simple connection test
  const conn = await mongoose.connect(process.env.MONGO_URI, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
  });
  
  console.log('✅ MongoDB connection successful!');
  console.log(`   Host: ${conn.connection.host}`);
  console.log(`   Database: ${conn.connection.name}`);
  console.log(`   Ready State: ${conn.connection.readyState}`);
  
  // Test a simple operation
  const collections = await conn.connection.db.listCollections().toArray();
  console.log(`   Collections: ${collections.length} found`);
  
  await mongoose.connection.close();
  console.log('✅ Connection test completed successfully');
  
} catch (error) {
  console.error('❌ MongoDB connection failed:');
  console.error(`   Error: ${error.message}`);
  
  if (error.message.includes('ECONNREFUSED')) {
    console.log('💡 Suggestions:');
    console.log('   - Make sure MongoDB is running on localhost:27017');
    console.log('   - Or update MONGO_URI in .env to point to your MongoDB instance');
  }
  
  process.exit(1);
}