import { } from 'dotenv/config'
import connectDB from "./db/index.js";


connectDB()


//one type of approach
/*
import express from "express";
const app = express()
    ; (async () => {
        try {
            await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
            app.on('error', (error) => {
                console.log("error", error)
                throw error
            })
        } catch (error) {
            console.error(error)
        }
    })();
*/