const mongoose = require('mongoose');

async function test() {
    await mongoose.connect('mongodb://127.0.0.1:27017/stockat_damanhour'); // Let's guess the DB connection string, wait, I can just use the project's connection

    // Actually, wait, writing an ad-hoc Node script is not needed if I can just look at `Order.ts` schema again.
}
test();
