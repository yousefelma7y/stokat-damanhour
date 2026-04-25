
// Mock process.env
process.env.MONGODB_URI = '';

try {
    const mongodb = require('./src/lib/mongodb.js');
    console.log('Successfully imported mongodb.js without MONGODB_URI');
} catch (error) {
    console.error('Failed to import mongodb.js:', error.message);
    process.exit(1);
}