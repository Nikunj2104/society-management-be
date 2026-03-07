import mongoose, { Schema, Document } from 'mongoose';

export interface IAppTheme extends Document {
    name: string;
    themeKey: string;
    type: 'regular' | 'festival'; // regular: user can choose; festival: superadmin sets globally
    isActiveFestival: boolean; // if true & type is festival, applied to everyone
    isPublished: boolean; // if true & type is regular, users can see/select it

    // Custom colors and backgrounds
    colors: {
        primary: string;
        background: string;
        surface: string;
        surfaceVariant: string;
        text: string;
    };
    backgroundImageUrl?: string; // Optional background like kites/holi drops
}

const AppThemeSchema: Schema = new Schema({
    name: { type: String, required: true },
    themeKey: { type: String, required: true, unique: true },
    type: { type: String, enum: ['regular', 'festival'], required: true },
    isActiveFestival: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },

    colors: {
        primary: { type: String, required: true },
        background: { type: String, required: true },
        surface: { type: String, required: true },
        surfaceVariant: { type: String, required: true },
        text: { type: String, required: true },
    },
    backgroundImageUrl: { type: String, required: false },
}, { timestamps: true });

export default mongoose.model<IAppTheme>('AppTheme', AppThemeSchema);
