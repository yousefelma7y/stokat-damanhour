const { connectDB } = require('./src/lib/mongodb');
const mongoose = require('mongoose');

// Register models
require('./src/models/Product');
require('./src/models/Scrap');
require('./src/models/Customer');
require('./src/models/Supplier');
require('./src/models/PaymentMethod');
require('./src/models/Service');
const Order = require('./src/models/Order').default;

async function check() {
    await connectDB();

    // Find an order with scrapItems
    const orderWithScrap = await Order.findOne({ "scrapItems.0": { $exists: true } });

    if (!orderWithScrap) {
        console.log('No order with scrap items found.');
        process.exit(0);
    }

    console.log('Order ID:', orderWithScrap._id);

    // Try to populate scrapItems.product
    const populated = await Order.findById(orderWithScrap._id)
        .populate({
            path: 'scrapItems.product',
            strictPopulate: false
        })
        .lean();

    console.log('Populated scrapItems:', JSON.stringify(populated.scrapItems, null, 2));

    // Check if product with that ID exists
    const firstScrap = orderWithScrap.scrapItems[0];
    const Product = mongoose.model('Product');
    const productDoc = await Product.findById(firstScrap.product).lean();
    console.log('Direct product lookup for ID', firstScrap.product, ':', productDoc ? 'Found: ' + productDoc.name : 'Not Found');

    process.exit(0);
}

check().catch(err => {
    console.error(err);
    process.exit(1);
});
