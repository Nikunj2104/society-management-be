import mongoose, { Schema, Document } from 'mongoose';

export interface IComplaint extends Document {
    title: string;
    description: string;
    category: string;
    status: 'Open' | 'In Progress' | 'Resolved';
    user: mongoose.Types.ObjectId;
    society: mongoose.Types.ObjectId;
    adminResponse?: string;
    images?: string[];
}

const ComplaintSchema: Schema = new Schema(
    {
        title: { type: String, required: true },
        description: { type: String, required: true },
        category: { type: String, default: 'General' },
        status: { type: String, enum: ['Open', 'In Progress', 'Resolved'], default: 'Open' },
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        society: { type: Schema.Types.ObjectId, ref: 'Society', required: true },
        adminResponse: { type: String },
        images: [{ type: String }],
    },
    { timestamps: true }
);

export default mongoose.model<IComplaint>('Complaint', ComplaintSchema);
