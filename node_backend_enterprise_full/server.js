
// Load environment variables first
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import authRoutes from './src/routes/auth.js';
import ticketRoutes from './src/routes/tickets.js';
import healthRoutes from './src/routes/health.js';
import accountRoutes from './src/routes/accounts.js';
import contactRoutes from './src/routes/contacts.js';
import teamRoutes from './src/routes/teams.js';
import agentRoutes from './src/routes/agents.js';
import companyRoutes from './src/routes/companies.js';
import { connectDB, initializeModels } from './src/config/database.js';
import { seedInitialData, seedSampleData } from './src/config/seeder.js';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load swagger document
const swaggerDoc = JSON.parse(
  readFileSync(join(__dirname, 'swagger', 'swagger.json'), 'utf8')
);

// Import models to ensure they're registered
import './src/models/User.js';
import './src/models/Ticket.js';
import './src/models/Account.js';
import './src/models/Contact.js';
import './src/models/Company.js';
import './src/models/Agent.js';
import './src/models/Role.js';
import './src/models/Permission.js';
import './src/models/Team.js';
import './src/models/SlaRule.js';
import './src/models/Tag.js';
import './src/models/TicketComment.js';
import './src/models/TicketHistory.js';
import './src/models/TicketAttachment.js';

const app = express();

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173', // Vite default port
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      'http://ticket-tracker-dev.s3-website-us-east-1.amazonaws.com',
      process.env.FRONTEND_URL
    ].filter(Boolean); // Remove undefined values
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['Authorization'],
  maxAge: 86400 // 24 hours
};

// Apply CORS middleware
app.use(cors(corsOptions));

// CORS debugging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Origin: ${req.get('Origin') || 'none'}`);
  next();
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize database connection and models
const initializeApp = async () => {
  try {
    console.log('Starting application initialization...');
    
    // Debug environment variables
    console.log('Environment check:');
    console.log(`- NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
    console.log(`- PORT: ${process.env.PORT || 'not set'}`);
    console.log(`- MONGO_URI: ${process.env.MONGO_URI ? 'set' : 'NOT SET'}`);
    
    // Connect to MongoDB
    await connectDB();
    
    // Initialize models and collections
    await initializeModels();
    
    // Seed initial data
    await seedInitialData();
    
    // Seed sample data in development
    if (process.env.NODE_ENV === 'development') {
      await seedSampleData();
    }
    
    console.log('✓ Application initialization completed successfully');
  } catch (error) {
    console.error('✗ Application initialization failed:', error);
    process.exit(1);
  }
};

// Initialize the application
await initializeApp();

// Handle preflight requests
app.options('*', cors(corsOptions));

// CORS test endpoint
app.get('/cors-test', (req, res) => {
  res.json({
    message: 'CORS is working!',
    origin: req.get('Origin'),
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/health', healthRoutes);
app.use('/auth', authRoutes);

app.use('/', accountRoutes);
app.use('/', contactRoutes);
app.use('/', teamRoutes);
app.use('/', agentRoutes);
app.use('/', companyRoutes);
app.use('/', ticketRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Enterprise backend running on port ${PORT}`);
});
