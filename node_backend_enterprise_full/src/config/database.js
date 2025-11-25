import mongoose from 'mongoose';

// MongoDB connection configuration
const connectDB = async () => {
  try {
    // Check if MONGO_URI is defined
    if (!process.env.MONGO_URI) {
      throw new Error(
        'MONGO_URI environment variable is not defined. ' +
        'Please create a .env file with MONGO_URI=mongodb://localhost:27017/enterprise'
      );
    }

    console.log('Connecting to MongoDB...');
    console.log(`MongoDB URI: ${process.env.MONGO_URI.replace(/\/\/.*@/, '//***:***@')}`); // Hide credentials in logs
    
    // Connection options (updated for newer MongoDB driver)
    const options = {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    };

    const conn = await mongoose.connect(process.env.MONGO_URI, options);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
    
    return conn;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
};

// Initialize database models and collections
const initializeModels = async () => {
  try {
    const models = mongoose.models;
    const initializedModels = [];
    
    for (const modelName in models) {
      const model = models[modelName];
      
      try {
        // Ensure collection exists
        await model.createCollection();
        
        // Create indexes defined in schema
        await model.ensureIndexes();
        
        initializedModels.push(modelName);
        console.log(`✓ Model ${modelName} initialized successfully`);
      } catch (error) {
        // Collection might already exist, which is fine
        if (error.code !== 48) { // 48 = NamespaceExists
          console.warn(`Warning initializing ${modelName}:`, error.message);
        } else {
          console.log(`✓ Model ${modelName} collection already exists`);
          initializedModels.push(modelName);
        }
      }
    }
    
    console.log(`Database initialization completed. Models: [${initializedModels.join(', ')}]`);
    return initializedModels;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
});

export { connectDB, initializeModels };