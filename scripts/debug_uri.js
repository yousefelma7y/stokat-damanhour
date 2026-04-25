const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });
console.log('URI Length:', (process.env.MONGODB_URI || '').length);
console.log('URI starts with mongodb:', (process.env.MONGODB_URI || '').startsWith('mongodb'));
process.exit(0);
