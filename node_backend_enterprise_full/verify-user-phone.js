import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

const runVerification = async () => {
    try {
        console.log('Connecting to MongoDB...');
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI not found in .env');
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        console.log('Test 1: Create user WITHOUT phone (should fail)...');
        try {
            await User.create({
                name: 'No Phone User',
                email: 'nophone@test.com',
                password: 'password123',
                role: 'customer'
            });
            throw new Error('User creation without phone should have failed');
        } catch (error) {
            if (error.name === 'ValidationError' && error.errors.phone) {
                console.log('✓ Correctly failed: Phone is required');
            } else {
                throw error;
            }
        }

        console.log('Test 2: Create user WITH phone (should succeed)...');
        const userWithPhone = await User.create({
            name: 'Phone User',
            email: 'phone@test.com',
            password: 'password123',
            role: 'customer',
            phone: '9876543210'
        });
        console.log('✓ User created successfully:', userWithPhone._id);

        console.log('Test 3: Verify phone field...');
        const fetchedUser = await User.findById(userWithPhone._id);
        if (fetchedUser.phone !== '9876543210') {
            throw new Error('Phone number mismatch');
        }
        console.log('✓ Phone field verified');

        console.log('Cleaning up...');
        await User.findByIdAndDelete(userWithPhone._id);
        console.log('Cleanup done');

        console.log('ALL TESTS PASSED');
    } catch (error) {
        console.error('Verification failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
};

runVerification();
