import mongoose, { Schema, Document } from 'mongoose';

export interface IOtpToken extends Document {
    user: mongoose.Types.ObjectId;
    otp: string;
    type: 'VERIFICATION' | 'FORGOT_PASSWORD';
    expiresAt: Date;
}

const OtpTokenSchema: Schema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        otp: { type: String, required: true },
        type: { type: String, enum: ['VERIFICATION', 'FORGOT_PASSWORD'], required: true },
        expiresAt: { type: Date, required: true, expires: 0 }, // Automatically deletes document when expired
    },
    { timestamps: true }
);

export default mongoose.model<IOtpToken>('OtpToken', OtpTokenSchema);
