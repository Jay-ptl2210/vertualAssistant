import express from 'express';

import dotenv from 'dotenv';
dotenv.config();
import connectDb from './config/db.js';
import authRouter from './routes/auth.route.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import userRouter from './routes/user.route.js';
import geminiResponse from './gemini.js';

const app = express();   
app.use(cors({
    origin:"https://vertualassistantbyjayptl.onrender.com",
    credentials:true, // Allow cookies to be sent with requests
}))
const port= process.env.PORT || 8000;

app.use(express.json());
app.use(cookieParser());
app.use("/api/auth",authRouter)
app.use("/api/user",userRouter)



app.get('/', (req, res) => {
    res.send('Hello World!');   
})

app.listen(port, () => {
    connectDb();
    console.log(`Server is running on port ${port}`);       
});
