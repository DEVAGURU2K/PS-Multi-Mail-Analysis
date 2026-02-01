import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env from correct path if not loaded
dotenv.config({ path: path.join(__dirname, '../../.env') });
// Or just .env if run from root. Better to be safe.

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/property-monitor';
        console.log(`Connecting to MongoDB at ${mongoURI}...`);
        await mongoose.connect(mongoURI);
        console.log('MongoDB Connected Successfully');
    } catch (err) {
        console.error('MongoDB Connection Error:', err);
        process.exit(1);
    }
};

export default connectDB;
