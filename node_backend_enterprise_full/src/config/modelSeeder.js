import bcrypt from 'bcryptjs';
import {
  User,
  Account,
  Contact,
  Agent,
  Role,
  Permission,
  Team,
  SlaRule,
  Tag
} from '../models/index.js';

// Seed permissions
export const seedPermissions = async () => {
  try {
    const permissionCount = await Permission.countDocuments();
    if (permissionCount > 0) {
      console.log('Permissions already exist. Skipping seeding.');
      return;
    }

    const permissions = [
      // Ticket permissions
      { permissionKey: 'tickets.create', description: 'Create tickets', module: 'tickets', action: 'create' },
      { permissionKey: 'tickets.read', description: 'View tickets', module: 'tickets', action: 'read' },
      { permissionKey: 'tickets.update', description: 'Update tickets', module: 'tickets', action: 'update' },
      { permissionKey: 'tickets.delete', description: 'Delete tickets', module: 'tickets', action: 'delete' },
      { permissionKey: 'tickets.manage', description: 'Manage all tickets', module: 'tickets', action: 'manage' },
      
      // User permissions
      { permissionKey: 'users.create', description: 'Create users', module: 'users', action: 'create' },
      { permissionKey: 'users.read', description: 'View users', module: 'users', action: 'read' },
      { permissionKey: 'users.update', description: 'Update users', module: 'users', action: 'update' },
      { permissionKey: 'users.delete', description: 'Delete users', module: 'users', action: 'delete' },
      
      // Account permissions
      { permissionKey: 'accounts.create', description: 'Create accounts', module: 'accounts', action: 'create' },
      { permissionKey: 'accounts.read', description: 'View accounts', module: 'accounts', action: 'read' },
      { permissionKey: 'accounts.update', description: 'Update accounts', module: 'accounts', action: 'update' },
      { permissionKey: 'accounts.delete', description: 'Delete accounts', module: 'accounts', action: 'delete' },
      
      // Reports permissions
      { permissionKey: 'reports.read', description: 'View reports', module: 'reports', action: 'read' },
      { permissionKey: 'reports.create', description: 'Create reports', module: 'reports', action: 'create' },
      
      // Settings permissions
      { permissionKey: 'settings.read', description: 'View settings', module: 'settings', action: 'read' },
      { permissionKey: 'settings.update', description: 'Update settings', module: 'settings', action: 'update' },
      
      // Admin permissions
      { permissionKey: 'admin.manage', description: 'Full admin access', module: 'admin', action: 'manage' }
    ];

    await Permission.insertMany(permissions);
    console.log('✓ Permissions seeded successfully');
  } catch (error) {
    console.error('Error seeding permissions:', error);
  }
};

// Seed roles
export const seedRoles = async () => {
  try {
    const roleCount = await Role.countDocuments();
    if (roleCount > 0) {
      console.log('Roles already exist. Skipping seeding.');
      return;
    }

    // Get permissions
    const allPermissions = await Permission.find();
    const ticketPermissions = allPermissions.filter(p => p.module === 'tickets');
    const userPermissions = allPermissions.filter(p => p.module === 'users');
    const accountPermissions = allPermissions.filter(p => p.module === 'accounts');
    const reportsPermissions = allPermissions.filter(p => p.module === 'reports');
    const settingsPermissions = allPermissions.filter(p => p.module === 'settings');
    const adminPermissions = allPermissions.filter(p => p.module === 'admin');

    const roles = [
      {
        roleName: 'Admin',
        description: 'Full system access',
        permissions: allPermissions.map(p => p._id)
      },
      {
        roleName: 'Supervisor',
        description: 'Team management and ticket oversight',
        permissions: [
          ...ticketPermissions.map(p => p._id),
          ...userPermissions.filter(p => p.action !== 'delete').map(p => p._id),
          ...accountPermissions.map(p => p._id),
          ...reportsPermissions.map(p => p._id)
        ]
      },
      {
        roleName: 'Agent',
        description: 'Handle and resolve tickets',
        permissions: [
          ...ticketPermissions.filter(p => p.action !== 'delete').map(p => p._id),
          ...accountPermissions.filter(p => p.action === 'read').map(p => p._id)
        ]
      },
      {
        roleName: 'Customer',
        description: 'Create and view own tickets',
        permissions: [
          ...ticketPermissions.filter(p => ['create', 'read'].includes(p.action)).map(p => p._id)
        ]
      }
    ];

    await Role.insertMany(roles);
    console.log('✓ Roles seeded successfully');
  } catch (error) {
    console.error('Error seeding roles:', error);
  }
};

// Seed teams
export const seedTeams = async () => {
  try {
    const teamCount = await Team.countDocuments();
    if (teamCount > 0) {
      console.log('Teams already exist. Skipping seeding.');
      return;
    }

    const teams = [
      {
        teamName: 'Technical Support',
        description: 'Handles technical issues and bugs'
      },
      {
        teamName: 'Customer Success',
        description: 'Focuses on customer satisfaction and retention'
      },
      {
        teamName: 'Billing Support',
        description: 'Handles billing and payment related issues'
      },
      {
        teamName: 'Sales Support',
        description: 'Assists with sales inquiries and pre-sales questions'
      }
    ];

    await Team.insertMany(teams);
    console.log('✓ Teams seeded successfully');
  } catch (error) {
    console.error('Error seeding teams:', error);
  }
};

// Seed SLA rules
export const seedSlaRules = async () => {
  try {
    const slaCount = await SlaRule.countDocuments();
    if (slaCount > 0) {
      console.log('SLA rules already exist. Skipping seeding.');
      return;
    }

    const slaRules = [
      {
        name: 'Urgent Priority SLA',
        firstResponseTimeMinutes: 15,
        resolutionTimeMinutes: 240, // 4 hours
        priority: 'urgent'
      },
      {
        name: 'High Priority SLA',
        firstResponseTimeMinutes: 60,
        resolutionTimeMinutes: 480, // 8 hours
        priority: 'high'
      },
      {
        name: 'Medium Priority SLA',
        firstResponseTimeMinutes: 240, // 4 hours
        resolutionTimeMinutes: 1440, // 24 hours
        priority: 'medium'
      },
      {
        name: 'Low Priority SLA',
        firstResponseTimeMinutes: 480, // 8 hours
        resolutionTimeMinutes: 4320, // 72 hours
        priority: 'low'
      }
    ];

    await SlaRule.insertMany(slaRules);
    console.log('✓ SLA rules seeded successfully');
  } catch (error) {
    console.error('Error seeding SLA rules:', error);
  }
};

// Seed tags
export const seedTags = async () => {
  try {
    const tagCount = await Tag.countDocuments();
    if (tagCount > 0) {
      console.log('Tags already exist. Skipping seeding.');
      return;
    }

    const tags = [
      { tagName: 'bug', color: '#EF4444', description: 'Software bugs and issues' },
      { tagName: 'feature-request', color: '#3B82F6', description: 'New feature requests' },
      { tagName: 'billing', color: '#F59E0B', description: 'Billing and payment issues' },
      { tagName: 'technical', color: '#10B981', description: 'Technical support' },
      { tagName: 'urgent', color: '#DC2626', description: 'Urgent issues' },
      { tagName: 'training', color: '#8B5CF6', description: 'Training and documentation' },
      { tagName: 'integration', color: '#06B6D4', description: 'Third-party integrations' },
      { tagName: 'performance', color: '#F97316', description: 'Performance related issues' }
    ];

    await Tag.insertMany(tags);
    console.log('✓ Tags seeded successfully');
  } catch (error) {
    console.error('Error seeding tags:', error);
  }
};

// Seed sample accounts
export const seedAccounts = async () => {
  try {
    const accountCount = await Account.countDocuments();
    if (accountCount > 0) {
      console.log('Accounts already exist. Skipping seeding.');
      return;
    }

    const accounts = [
      {
        accountName: 'Acme Corporation',
        address: '123 Business St, Enterprise City, EC 12345',
        website: 'acme.com'
      },
      {
        accountName: 'TechStart Inc',
        address: '456 Innovation Ave, Startup Valley, SV 67890',
        website: 'techstart.io'
      },
      {
        accountName: 'Global Solutions Ltd',
        address: '789 Corporate Blvd, Business District, BD 54321',
        website: 'globalsolutions.com'
      }
    ];

    await Account.insertMany(accounts);
    console.log('✓ Sample accounts seeded successfully');
  } catch (error) {
    console.error('Error seeding accounts:', error);
  }
};

// Main seeder function
export const seedAllModels = async () => {
  try {
    console.log('Starting model seeding...');
    
    await seedPermissions();
    await seedRoles();
    await seedTeams();
    await seedSlaRules();
    await seedTags();
    await seedAccounts();
    
    console.log('✓ All models seeded successfully');
  } catch (error) {
    console.error('Error in model seeding:', error);
  }
};