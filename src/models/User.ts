import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    role: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
    society?: mongoose.Types.ObjectId;
    flatNumber?: string;
    phone?: string;
    isActive: boolean;
    status: 'active' | 'inactive' | 'deleted';
    isVerified: boolean;
    themePreference: 'Light' | 'Dark' | 'Festival';
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String },
        role: {
            type: String,
            enum: ['SUPER_ADMIN', 'ADMIN', 'USER'],
            default: 'USER'
        },
        society: { type: Schema.Types.ObjectId, ref: 'Society' },
        flatNumber: { type: String },
        phone: { type: String },
        isActive: { type: Boolean, default: true },
        status: { type: String, enum: ['active', 'inactive', 'deleted'], default: 'active' },
        isVerified: { type: Boolean, default: false },
        themePreference: {
            type: String,
            enum: ['Light', 'Dark', 'Festival'],
            default: 'Light'
        }
    },
    { timestamps: true }
);

// Password hashing middleware
UserSchema.pre('save', async function () {
    if (!this.isModified('password') || !this.password) return;

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password as string, salt);
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);
