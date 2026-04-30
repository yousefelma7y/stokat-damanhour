const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI not found in .env.local');
  process.exit(1);
}

async function run() {
  console.log('--- CUSTOMER DEBT SYNC START ---');
  console.log('Connecting to database...');
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected.');
    
    // Minimal schemas for sync
    const Customer = mongoose.model('Customer', new mongoose.Schema({ 
      _id: Number, 
      name: String, 
      debtBalance: { type: Number, default: 0 },
      totalDebt: { type: Number, default: 0 },
      totalPayments: { type: Number, default: 0 },
      isActive: Boolean 
    }, { strict: false }));
    
    const Order = mongoose.model('Order', new mongoose.Schema({ 
      customer: Number, 
      status: String, 
      remainingAmount: Number, 
      debtAmount: Number,
      paidAmount: Number,
      isActive: Boolean 
    }, { strict: false }));
    
    const customers = await Customer.find({ isActive: true }).lean();
    console.log(`Processing ${customers.length} active customers...`);
    
    for (const customer of customers) {
      const orders = await Order.find({ 
        customer: customer._id, 
        status: 'completed',
        isActive: true
      }).lean();
      
      const calculatedDebtBalance = orders.reduce((sum, o) => sum + (Number(o.remainingAmount) || 0), 0);
      const calculatedTotalDebt = orders.reduce((sum, o) => sum + (Number(o.debtAmount) || 0), 0);
      const calculatedTotalPayments = orders.reduce((sum, o) => sum + (Number(o.paidAmount) || 0), 0);
      
      const roundedDebtBalance = Math.round(calculatedDebtBalance * 100) / 100;
      const roundedTotalDebt = Math.round(calculatedTotalDebt * 100) / 100;
      const roundedTotalPayments = Math.round(calculatedTotalPayments * 100) / 100;
      
      console.log(`[ID: ${customer._id}] ${customer.name}:`);
      console.log(`  - Debt Orders: ${orders.filter(o => (o.remainingAmount || 0) > 0.01).length}`);
      console.log(`  - Debt Balance: ${customer.debtBalance || 0} -> ${roundedDebtBalance}`);
      console.log(`  - Total Debt: ${customer.totalDebt || 0} -> ${roundedTotalDebt}`);
      console.log(`  - Total Payments: ${customer.totalPayments || 0} -> ${roundedTotalPayments}`);
      
      await Customer.updateOne({ _id: customer._id }, {
        $set: { 
          debtBalance: roundedDebtBalance,
          totalDebt: roundedTotalDebt,
          totalPayments: roundedTotalPayments,
          updatedAt: new Date()
        }
      });
    }
    
    console.log('--- SYNC COMPLETED SUCCESSFULLY ---');
  } catch (err) {
    console.error('Error during sync:', err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
