import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import http from 'http';
import { initSocket } from './socket';

// Routes
import authRoutes from './routes/authRoutes';
import superAdminRoutes from './routes/superAdminRoutes';
import adminRoutes from './routes/adminRoutes';
import userRoutes from './routes/userRoutes';
import notificationRoutes from './routes/notificationRoutes';
import themeRoutes from './routes/themeRoutes';

// Load env vars
dotenv.config();

const app: Express = express();
const server = http.createServer(app);
const port = process.env.PORT || 5000;

// Init Websockets
initSocket(server);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Database Connection
mongoose
    .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/society-management')
    .then(() => console.log('✅ MongoDB connected successfully'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));

// Basic Route
app.get('/', (req: Request, res: Response) => {
    res.send('Welcome to Society Management API');
});

app.use('/api/auth', authRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/themes', themeRoutes);

// Start Server (only if not running on Vercel)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    server.listen(port, () => {
        console.log(`🚀 Server is running at http://localhost:${port}`);
    });
} else {
    console.log('✅ Running in Serverless/Vercel environment');
}

export default app;
