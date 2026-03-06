import mongoose, { Schema, Document } from 'mongoose';

export interface IAnnouncement extends Document {
    title: string;
    content: string;
    society: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
}

const AnnouncementSchema: Schema = new Schema(
    {
        title: { type: String, required: true },
        content: { type: String, required: true },
        society: { type: Schema.Types.ObjectId, ref: 'Society', required: true },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

export default mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);
