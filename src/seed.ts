import mongoose from 'mongoose';
import Notification from './models/Notification';
import dotenv from 'dotenv';
dotenv.config();

export const FESTIVALS = [
    {
        name: "Urgent Maintenance Notice",
        date: "03-07",
        theme: "ocean",
        startTime: "14:15",
        endTime: "15:30",
        message: "Server maintenance in progress. Do not refresh.",
        emojis: ["\u26A0\uFE0F", "\u{1F527}", "\u23F3"],
        notificationType: 'persistent'
    },
    {
        name: "Everyday Positivity",
        date: "always",
        alwaysActive: true,
        theme: "neon",
        message: "Have a wonderful day! Click X to close this.",
        emojis: ["\u{1F31F}", "\u2600\uFE0F"],
        notificationType: 'dismissible'
    },
    {
        name: "Holi",
        date: "03-24",
        theme: "holi",
        message: "Happy Holi! \u{1F3A8}",
        emojis: ["\u{1F3A8}", "\u{1F308}", "\u{1F338}"],
        notificationType: 'auto-dismiss'
    },
    {
        name: "Diwali",
        date: "11-01",
        theme: "diwali",
        message: "Happy Diwali! \u{1FA94}",
        emojis: ["\u{1FA94}", "\u{1F386}", "\u2728"],
        notificationType: 'auto-dismiss'
    },
    {
        name: "Uttarayan",
        date: "01-14",
        theme: "uttarayan",
        message: "Happy Uttarayan! \u{1FA81}",
        emojis: ["\u{1FA81}", "\u{1F324}\uFE0F", "\u{1F9F5}"],
        notificationType: 'auto-dismiss'
    },
    {
        name: "Raksha Bandhan",
        date: "08-19",
        theme: "rakshabandhan",
        message: "Happy Raksha Bandhan! \u{1F380}",
        emojis: ["\u{1F380}", "\u{1F3F5}\uFE0F", "\u{1F38A}"],
        notificationType: 'auto-dismiss'
    },
    {
        name: "Janmashtami",
        date: "08-26",
        theme: "janmashtami",
        message: "Happy Janmashtami! \u{1F99A}",
        emojis: ["\u{1F99A}", "\u{1F549}\uFE0F", "\u{1F404}"],
        notificationType: 'auto-dismiss'
    },
    {
        name: "Ganesh Chaturthi",
        date: "09-07",
        theme: "ganeshChaturthi",
        message: "Happy Ganesh Chaturthi! \u{1F418}",
        emojis: ["\u{1F418}", "\u{1F33A}", "\u{1F965}"],
        notificationType: 'auto-dismiss'
    }
];

mongoose
    .connect(process.env.MONGO_URI || '')
    .then(async () => {
        console.log('Connected to DB');
        const count = await Notification.countDocuments();
        if (count === 0) {
            await Notification.insertMany(FESTIVALS);
            console.log('Seeded database with themes');
        } else {
            console.log('Database already has items, skipped seeding.');
        }
        process.exit();
    })
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
