import mongoose, { Schema, Document } from 'mongoose';

export interface IUserNotification extends Document {
    user: mongoose.Types.ObjectId;
    society: mongoose.Types.ObjectId;
    title: string;
    message: string;
    type: 'maintenance' | 'announcement' | 'event' | 'complaint' | 'other';
    isRead: boolean;
    relatedId?: mongoose.Types.ObjectId;
}

const UserNotificationSchema: Schema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        society: { type: Schema.Types.ObjectId, ref: 'Society', required: true },
        title: { type: String, required: true },
        message: { type: String, required: true },
        type: { 
            type: String, 
            enum: ['maintenance', 'announcement', 'event', 'complaint', 'other'],
            default: 'other'
        },
        isRead: { type: Boolean, default: false },
        relatedId: { type: Schema.Types.ObjectId },
    },
    { timestamps: true }
);

// Index for faster lookups
UserNotificationSchema.index({ user: 1, isRead: 1 });

export default mongoose.model<IUserNotification>('UserNotification', UserNotificationSchema);
