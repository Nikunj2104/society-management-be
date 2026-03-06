import mongoose, { Schema, Document } from 'mongoose';

export interface IMaintenance extends Document {
    society: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    amount: number;
    month: string;
    year: number;
    dueDate: Date;
    isPaid: boolean;
    paymentMode?: 'Cash' | 'Online';
    paidAt?: Date;
    description?: string;
}

const MaintenanceSchema: Schema = new Schema(
    {
        society: { type: Schema.Types.ObjectId, ref: 'Society', required: true },
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        amount: { type: Number, required: true },
        month: { type: String, required: true },
        year: { type: Number, required: true },
        dueDate: { type: Date, required: true },
        isPaid: { type: Boolean, default: false },
        paymentMode: { type: String, enum: ['Cash', 'Online'] },
        paidAt: { type: Date },
        description: { type: String },
    },
    { timestamps: true }
);

export default mongoose.model<IMaintenance>('Maintenance', MaintenanceSchema);
