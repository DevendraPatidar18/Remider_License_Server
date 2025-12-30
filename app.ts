import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';

// Import Routes (will be created later)
import authRoutes from './modules/auth/auth.routes';
import deviceRoutes from './modules/devices/device.routes';
import licenseRoutes from './modules/licenses/license.routes';
import transferRoutes from './modules/transfers/transfer.routes';
import adminRoutes from './modules/admin/admin.routes';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'License Server Running' });
});

app.use('/auth', authRoutes);
app.use('/devices', deviceRoutes);
app.use('/license', licenseRoutes);
app.use('/transfers', transferRoutes);
app.use('/admin', adminRoutes);

// Error Handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
});

export default app;
