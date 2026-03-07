import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
    name: string;
    date: string;
    startTime?: string;
    endTime?: string;
    theme: string;
    message: string;
    emojis: string[];
    alwaysActive: boolean;
    notificationType: 'auto-dismiss' | 'dismissible' | 'persistent';
    isActive: boolean;
}

const NotificationSchema: Schema = new Schema({
    name: { type: String, required: true },
    date: { type: String, required: true },
    startTime: { type: String },
    endTime: { type: String },
    theme: { type: String, required: true },
    message: { type: String, required: true },
    emojis: { type: [String], default: [] },
    alwaysActive: { type: Boolean, default: false },
    notificationType: { type: String, enum: ['auto-dismiss', 'dismissible', 'persistent'], default: 'auto-dismiss' },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model<INotification>('Notification', NotificationSchema);
