const mongoose = require('mongoose');
const MONGODB_URI = "mongodb+srv://yousefelmahy7112000_db_user:elmahy7112000@cluster0.yhzlpmr.mongodb.net/StockatDamanhour";

async function fixIndex() {
    console.log('--- Index Fix Script (Hardcoded) Started ---');
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 10000
        });
        console.log('✅ Connected successfully!');

        const db = mongoose.connection.db;
        const collection = db.collection('users');

        console.log('🔍 Checking indexes...');
        const indexes = await collection.indexes();
        console.log('Current indexes:', JSON.stringify(indexes, null, 2));

        const emailIndex = indexes.find(idx => idx.name === 'email_1' || (idx.key && idx.key.email));

        if (emailIndex) {
            console.log(`🗑️ Dropping index: ${emailIndex.name}...`);
            await collection.dropIndex(emailIndex.name);
            console.log(`✅ Index dropped!`);
        } else {
            console.log('ℹ️ No email unique index found.');
        }

        console.log('--- Script Completed ---');
        process.exit(0);
    } catch (error) {
        console.error('❌ FATAL ERROR:', error);
        process.exit(1);
    }
}

fixIndex();
