import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';

// Load env vars
dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5000;

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

// Routes
import authRoutes from './routes/authRoutes';
import superAdminRoutes from './routes/superAdminRoutes';
import adminRoutes from './routes/adminRoutes';
import userRoutes from './routes/userRoutes';

app.use('/api/auth', authRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);

// Start Server
app.listen(port, () => {
    console.log(`🚀 Server is running at http://localhost:${port}`);
});
