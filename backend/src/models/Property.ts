import mongoose, { Schema, Document } from 'mongoose';

export interface IProperty extends Document {
    title?: string;
    source: 'email' | 'web' | 'manual';
    link: string;
    raw_email_id?: string;
    sender?: string;
    receivedAt?: Date;
    extracted_data: {
        rent?: string;
        bhk?: string; // e.g. "2 BHK"
        address?: string;
        unit_type?: string; // apartment, villa
        size?: string; // e.g. "1200 sqft"
        description?: string;
    };
    status: 'new' | 'processed' | 'archived';
    createdAt: Date;
    updatedAt: Date;
}

const PropertySchema: Schema = new Schema({
    title: { type: String },
    source: { type: String, required: true, enum: ['email', 'web', 'manual'], default: 'email' },
    link: { type: String, required: true, unique: true },
    raw_email_id: { type: String },
    sender: { type: String },
    receivedAt: { type: Date, default: Date.now },
    extracted_data: {
        rent: String,
        bhk: String,
        address: String,
        unit_type: String,
        size: String,
        description: String
    },
    status: { type: String, enum: ['new', 'processed', 'archived'], default: 'new' }
}, { timestamps: true });

export default mongoose.model<IProperty>('Property', PropertySchema);
