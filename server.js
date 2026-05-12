import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './configs/db.js'
import { clerkMiddleware } from '@clerk/express'
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js"

const app = express()
const port = 3000

await connectDB()

// M-wares
app.use(express.json())
app.use(cors())
app.use(clerkMiddleware())

// API Routes
app.use('/api/inngest', serve({client: inngest, functions }))

app.get('/', (req, res) => res.send('Server is LIVE!'))
app.listen(port, () => console.log(`Server is listening at port:${port}`))