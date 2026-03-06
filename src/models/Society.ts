import mongoose, { Schema, Document } from 'mongoose';

export interface ISociety extends Document {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    numberOfUnits: number;
    contactNumber?: string;
    contactEmail?: string;
    isActive: boolean;
    registrationDate: Date;
}

const SocietySchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String, required: true },
        numberOfUnits: { type: Number, required: true },
        contactNumber: { type: String },
        contactEmail: { type: String },
        isActive: { type: Boolean, default: true },
        registrationDate: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

export default mongoose.model<ISociety>('Society', SocietySchema);
