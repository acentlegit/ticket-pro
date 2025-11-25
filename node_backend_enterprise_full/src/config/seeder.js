import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { seedAllModels } from './modelSeeder.js';

// Seed initial admin user if no users exist
export const seedInitialData = async () => {
  try {
    // First seed all the new models (permissions, roles, etc.)
    await seedAllModels();

    // Check if any users exist
    const userCount = await User.countDocuments();

    if (userCount === 0) {
      console.log('No users found. Creating initial admin user...');

      // Create default admin user
      const hashedPassword = await bcrypt.hash('admin123', 12);

      const adminUser = new User({
        name: 'System Administrator',
        email: 'admin@enterprise.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        phone: '1234567890'
      });

      await adminUser.save();
      console.log('✓ Initial admin user created successfully');
      console.log('  Email: admin@enterprise.com');
      console.log('  Password: admin123');
      console.log('  Please change the password after first login!');
    } else {
      console.log(`Database already contains ${userCount} users. Skipping user seeding.`);
    }
  } catch (error) {
    console.error('Error seeding initial data:', error);
  }
};

// Create sample data for development
export const seedSampleData = async () => {
  try {
    if (process.env.NODE_ENV !== 'development') {
      console.log('Sample data seeding is only available in development mode');
      return;
    }

    const userCount = await User.countDocuments();

    if (userCount <= 1) { // Only admin exists
      console.log('Creating sample users for development...');

      const sampleUsers = [
        {
          name: 'John Supervisor',
          email: 'supervisor@enterprise.com',
          password: await bcrypt.hash('supervisor123', 12),
          role: 'supervisor',
          phone: '1112223333'
        },
        {
          name: 'Jane Agent',
          email: 'agent@enterprise.com',
          password: await bcrypt.hash('agent123', 12),
          role: 'agent',
          phone: '4445556666'
        },
        {
          name: 'Bob Customer',
          email: 'customer@enterprise.com',
          password: await bcrypt.hash('customer123', 12),
          role: 'customer',
          phone: '7778889999'
        }
      ];

      await User.insertMany(sampleUsers);
      console.log('✓ Sample users created successfully');
    }
  } catch (error) {
    console.error('Error seeding sample data:', error);
  }
};