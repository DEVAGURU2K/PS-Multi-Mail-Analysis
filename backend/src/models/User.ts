import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    email: string;
    password: string;
    createdAt: Date;
    comparePassword(password: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
}, { timestamps: true });

UserSchema.pre('save', async function (next) {
    const user = this as any;
    if (!user.isModified('password')) return next();
    user.password = await bcrypt.hash(user.password as string, 10);
    next();
});

UserSchema.methods.comparePassword = function (password: string) {
    return bcrypt.compare(password, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);
