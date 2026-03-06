import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
    title: string;
    description?: string;
    society: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
    eventDate: Date;
    isFestival: boolean;
    festivalName?: string;
}

const EventSchema: Schema = new Schema(
    {
        title: { type: String, required: true },
        description: { type: String },
        society: { type: Schema.Types.ObjectId, ref: 'Society', required: true },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        eventDate: { type: Date, required: true },
        isFestival: { type: Boolean, default: false },
        festivalName: { type: String },
    },
    { timestamps: true }
);

export default mongoose.model<IEvent>('Event', EventSchema);
