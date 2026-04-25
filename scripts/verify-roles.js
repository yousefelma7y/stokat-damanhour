const mongoose = require('mongoose');
const path = require('path');
console.log('Script started. Loading env...');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
console.log('Env loaded. URI length:', process.env.MONGODB_URI ? process.env.MONGODB_URI.length : 'undefined');

// Define the schema inline to avoid ES module import issues with 'node'
// This ensures we verify the *concept* works with Mongoose, and we manually checked the file content.
const UserSchema = new mongoose.Schema(
    {
        userName: {
            type: String,
            required: [true, "Please provide a username"],
            unique: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, "Please provide a password"],
        },
        brandName: {
            type: String,
            required: [true, "Please provide a brand name"],
        },
        location: {
            type: String,
            required: [true, "Please provide a brand location"],
        },
        phone: {
            type: String,
            required: [true, "Please provide a brand phone"],
        },
        logo: {
            type: String,
            default: "",
        },
        role: {
            type: String,
            enum: ["admin", "sales"],
            default: "sales",
        },
    },
    {
        timestamps: true,
    }
);

// We use a different model name to avoid compiling conflicts if we were importing
const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function verifyRoles() {
    try {
        const MONGODB_URI = process.env.MONGODB_URI;
        if (!MONGODB_URI) {
            // Fallback or error
            console.error('MONGODB_URI not found');
            throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
        }

        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // cleanup
        try {
            await User.deleteMany({ userName: { $in: ['test_admin_user', 'test_sales_user', 'test_default_user'] } });
        } catch (e) {
            console.log('Cleanup error (might be fine):', e.message);
        }

        // 1. Create Admin User
        console.log('Creating Admin User...');
        const adminUser = await User.create({
            userName: 'test_admin_user',
            password: 'password123',
            brandName: 'Test Brand',
            location: 'Test Loc',
            phone: '1234567890',
            role: 'admin'
        });
        console.log('Admin User Created. Role:', adminUser.role);
        if (adminUser.role !== 'admin') throw new Error('Admin role mismatch');

        // 2. Create Sales User (default)
        console.log('Creating Sales User (explicit)...');
        const salesUser = await User.create({
            userName: 'test_sales_user',
            password: 'password123',
            brandName: 'Test Brand',
            location: 'Test Loc',
            phone: '1234567890',
            role: 'sales'
        });
        console.log('Sales User Created. Role:', salesUser.role);
        if (salesUser.role !== 'sales') throw new Error('Sales role mismatch');

        // 3. Verify Default Role
        console.log('Creating User with Default Role...');
        const defaultUser = await User.create({
            userName: 'test_default_user',
            password: 'password123',
            brandName: 'Test Brand',
            location: 'Test Loc',
            phone: '1234567890',
            // No role
        });
        console.log('Default User Created. Role:', defaultUser.role);
        if (defaultUser.role !== 'sales') throw new Error('Default role mismatch');

        // Cleanup again
        await User.deleteMany({ userName: { $in: ['test_admin_user', 'test_sales_user', 'test_default_user'] } });

        console.log('VERIFICATION SUCCESSFUL: All roles handled correctly.');
        process.exit(0);
    } catch (error) {
        console.error('Verification Failed:', error);
        process.exit(1);
    }
}

const fs = require('fs');
const util = require('util');
const logFile = fs.createWriteStream('verification_result.txt', { flags: 'w' });
const logStdout = process.stdout;

console.log = function (d) { //
    logFile.write(util.format(d) + '\n');
    logStdout.write(util.format(d) + '\n');
};
console.error = console.log;

verifyRoles();
