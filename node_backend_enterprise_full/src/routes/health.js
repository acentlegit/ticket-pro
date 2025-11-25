import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// Health check endpoint
router.get('/', async (req, res) => {
  try {
    const healthCheck = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: 'disconnected',
        name: null,
        host: null
      },
      memory: process.memoryUsage(),
      version: process.version
    };

    // Check database connection
    if (mongoose.connection.readyState === 1) {
      healthCheck.database = {
        status: 'connected',
        name: mongoose.connection.name,
        host: mongoose.connection.host,
        models: Object.keys(mongoose.models)
      };
    } else {
      healthCheck.status = 'WARNING';
      healthCheck.database.status = 'disconnected';
    }

    const statusCode = healthCheck.status === 'OK' ? 200 : 503;
    res.status(statusCode).json(healthCheck);
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Database-specific health check
router.get('/db', async (req, res) => {
  try {
    // Test database connection with a simple query
    const dbStats = await mongoose.connection.db.stats();
    
    res.json({
      status: 'OK',
      database: {
        connected: mongoose.connection.readyState === 1,
        name: mongoose.connection.name,
        host: mongoose.connection.host,
        collections: dbStats.collections,
        dataSize: dbStats.dataSize,
        storageSize: dbStats.storageSize,
        indexes: dbStats.indexes
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      database: {
        connected: false,
        error: error.message
      }
    });
  }
});

export default router;