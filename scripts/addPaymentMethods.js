const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const CounterSchema = new mongoose.Schema({
    modelName: { type: String, required: true, unique: true },
    sequenceValue: { type: Number, default: 0 },
});
const Counter = mongoose.models.Counter || mongoose.model('Counter', CounterSchema);

async function getNextSequence(modelName) {
    const counter = await Counter.findOneAndUpdate(
        { modelName },
        { $inc: { sequenceValue: 1 } },
        { new: true, upsert: true }
    );
    return counter.sequenceValue;
}

const PaymentMethodSchema = new mongoose.Schema({
    _id: Number,
    name: { type: String, required: true, unique: true },
    type: { type: String, enum: ["cash", "bank", "wallet", "other"], default: "cash" },
    balance: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
}, { timestamps: true, _id: false });

PaymentMethodSchema.pre('save', async function (next) {
    if (this.isNew && !this._id) {
        this._id = await getNextSequence('payment_method');
    }
    next();
});

const PaymentMethod = mongoose.models.PaymentMethod || mongoose.model('PaymentMethod', PaymentMethodSchema);

const methods = [
    { name: 'كاش', type: 'cash' },
    { name: 'انستاباي', type: 'bank' },
    { name: 'محفظه', type: 'wallet' },
    { name: 'فيزا', type: 'bank' }
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Connected to database");
        for (const m of methods) {
            const existing = await PaymentMethod.findOne({ name: m.name });
            if (!existing) {
                await PaymentMethod.create(m);
                console.log(`✅ Added ${m.name}`);
            } else {
                console.log(`ℹ️ Already exists ${m.name}`);
            }
        }
        process.exit(0);
    } catch(e) {
        console.error("❌ Error:", e);
        process.exit(1);
    }
}
seed();
