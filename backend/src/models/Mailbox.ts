import mongoose, { Schema, Document } from 'mongoose';

export interface IMailbox extends Document {
    owner: mongoose.Types.ObjectId;
    email: string;
    password: string; // Encrypted
    host: string;
    port: number;
    tls: boolean;
    isActive: boolean;
    lastChecked?: Date;
}

const MailboxSchema: Schema = new Schema({
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    host: { type: String, required: true, default: 'imap.gmail.com' },
    port: { type: Number, required: true, default: 993 },
    tls: { type: Boolean, required: true, default: true },
    isActive: { type: Boolean, default: true },
    lastChecked: { type: Date }
}, { timestamps: true });

export default mongoose.model<IMailbox>('Mailbox', MailboxSchema);
