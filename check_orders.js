const { connectDB } = require('./src/lib/mongodb');
const mongoose = require('mongoose');

// We need to register the models before we can query them
require('./src/models/Product');
require('./src/models/Scrap');
require('./src/models/Customer');
require('./src/models/Supplier');
require('./src/models/PaymentMethod');
require('./src/models/Service');
const Order = require('./src/models/Order').default;

async function check() {
    await connectDB();
    const orders = await Order.find({ "scrapItems.0": { $exists: true } }).limit(5).lean();
    console.log('Orders with scrapItems:', JSON.stringify(orders.map(o => ({
        _id: o._id,
        scrapItems: o.scrapItems.map(si => ({
            product: si.product,
            refModel: si.refModel
        }))
    })), null, 2));
    process.exit(0);
}
check();
