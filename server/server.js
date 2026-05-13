import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import bcrypt from 'bcryptjs';

import cookieParser from 'cookie-parser';
import connectDB from './config/mongodb.js';
import authRouter from './routes/authRoutes.js';

(async () => {
    const app = express();
    const port = process.env.PORT || 4000;
    await connectDB();

    app.use(express.json());
    app.use(cookieParser());
    app.use(cors({credentials: true}));

    //api Endpoint 
    app.get('/', (req, res) => {
        res.send('Hello World!');
    });
    app.use('/api/auth', authRouter);

    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
})();

