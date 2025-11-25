# Database Setup Guide

## MongoDB Configuration

The application now includes comprehensive MongoDB configuration with automatic model initialization and seeding.

### Features Added

1. **Enhanced Database Connection**
   - Proper connection handling with retry logic
   - Connection pooling configuration
   - Graceful shutdown handling

2. **Model Initialization**
   - Automatic collection creation
   - Index creation for optimal performance
   - Model validation and constraints

3. **Data Seeding**
   - Initial admin user creation
   - Sample data for development environment
   - Automatic seeding on first run

4. **Health Monitoring**
   - `/health` - General application health
   - `/health/db` - Database-specific health check

### Environment Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update MongoDB connection string in `.env`:
   ```
   MONGO_URI=mongodb://localhost:27017/enterprise
   ```

3. For MongoDB Atlas (cloud), use:
   ```
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/enterprise?retryWrites=true&w=majority
   ```

### Default Users Created

On first run, the application creates:

- **Admin User**
  - Email: `admin@enterprise.com`
  - Password: `admin123`
  - Role: `admin`

In development mode, additional sample users are created:
- Supervisor: `supervisor@enterprise.com` / `supervisor123`
- Agent: `agent@enterprise.com` / `agent123`
- Customer: `customer@enterprise.com` / `customer123`

**⚠️ Important: Change default passwords after first login!**

### Database Models

#### User Model
- Enhanced validation and constraints
- Email uniqueness and format validation
- Role-based access control
- Automatic password exclusion from JSON responses
- Performance indexes on key fields

#### Ticket Model
- Comprehensive validation rules
- Status and priority enums
- SLA tracking capabilities
- Automatic timestamp management
- Performance indexes for common queries

### Running the Application

```bash
npm install
npm start
```

The application will:
1. Connect to MongoDB
2. Initialize collections and indexes
3. Seed initial data if needed
4. Start the server on port 4000

### Health Checks

- `GET /health` - Overall application health
- `GET /health/db` - Database connection status

### Troubleshooting

1. **Connection Issues**
   - Verify MongoDB is running
   - Check connection string format
   - Ensure network connectivity

2. **Authentication Errors**
   - Verify username/password in connection string
   - Check database permissions

3. **Performance Issues**
   - Monitor index usage
   - Check connection pool settings
   - Review query patterns