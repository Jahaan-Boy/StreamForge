import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser';
import userRouter from './routes/user.route.js'
import commentRouter from './routes/comment.route.js';
import authRouter from './routes/auth.route.js'
import videoRouter from './routes/video.route.js'
import subscriptionRouter from './routes/subscription.route.js'
const app=express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit: '16kb'}))
app.use(express.urlencoded({extended: true, limit: '16kb'}))
app.use(express.static('public'))
app.use(cookieParser())

app.use('/api/v1/auth',authRouter)
app.use('/api/v1/users',userRouter)
app.use('/api/v1/comments', commentRouter)
app.use('/api/v1/videos',videoRouter)
app.use('/api/v1/subscriptions',subscriptionRouter)
export { app }