// FILE LOCATION: scripts/fixUserIndex.js

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

async function fixIndex() {
    console.log('--- Index Fix Script Started ---');
    try {
        if (!MONGODB_URI) {
            throw new Error('MONGODB_URI not found in .env.local');
        }

        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000
        });
        console.log('✅ Connected successfully to:', mongoose.connection.name);

        const db = mongoose.connection.db;
        const collection = db.collection('users');

        console.log('🔍 Checking indexes for collection: users...');
        const indexes = await collection.indexes();
        console.log('Current indexes:', JSON.stringify(indexes, null, 2));

        const emailIndex = indexes.find(idx => idx.name === 'email_1' || (idx.key && idx.key.email));

        if (emailIndex) {
            console.log(`🗑️ Dropping index: ${emailIndex.name}...`);
            await collection.dropIndex(emailIndex.name);
            console.log(`✅ Index "${emailIndex.name}" dropped successfully!`);
        } else {
            console.log('ℹ️ No email unique index found.');
        }

        console.log('🔍 Double checking indexes...');
        const finalIndexes = await collection.indexes();
        console.log('Final indexes:', finalIndexes.map(idx => idx.name));

        console.log('--- Script Completed Successfully ---');
        process.exit(0);
    } catch (error) {
        console.error('❌ FATAL ERROR:', error);
        process.exit(1);
    }
}

fixIndex();
