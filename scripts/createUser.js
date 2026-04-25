const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

// Get MongoDB URI from environment variable
const MONGODB_URI = process.env.MONGODB_URI;

// Counter Schema for Auto-increment
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

const UserSchema = new mongoose.Schema({
    _id: Number,
    userName: { type: String, required: true, unique: true, lowercase: true },
    salary: { type: Number, default: 0 },
    password: { type: String, required: true, select: false },
    brandName: String,
    location: String,
    phone: String,
    logo: String,
    role: String,
    isActive: { type: Boolean, default: true },
}, { timestamps: true, _id: false });

// Auto-increment ID hook
UserSchema.pre('save', async function (next) {
    if (this.isNew && !this._id) {
        this._id = await getNextSequence('user');
    }
    next();
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function createUser() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected successfully!');

        // Check if user already exists
        const existingUser = await User.findOne({ userName: 'admin' });
        if (existingUser) {
            console.log('⚠️  User "admin" already exists!');
            console.log('ID:', existingUser._id);
            process.exit(0);
        }

        // Note: Password hashing is handled by the model in the main app,
        // but since we redefined the model here without the hashing hook 
        // (to match the main model's behavior), we should manually hash or add the hook.
        // Actually, let's keep it simple and hash here as before.

        console.log('🔐 Hashing password...');
        const hashedPassword = await bcrypt.hash('admin', 10); // 10 = salt rounds

        const user = await User.create({
            userName: 'admin',
            salary: 0,
            password: hashedPassword,
            brandName: 'Stockat Damanhour',
            location: 'شارع عبد السلام الشاذلي',
            phone: '01000020000',
            logo: '',
            role: 'admin',
        });

        console.log('\n✅ User created successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📝 Login Credentials:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Username:', user.userName);
        console.log('Password: admin');
        console.log('User ID:', user._id);
        console.log('Salary:', user.salary);
        console.log('Brand Name:', user.brandName);
        console.log('Role:', user.role);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

createUser();
