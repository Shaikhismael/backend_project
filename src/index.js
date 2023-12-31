import { } from 'dotenv/config'
import connectDB from "./db/index.js";
import app from './app.js';


connectDB()
    .then(() => {
        app.listen(process.env.PORT, () => console.log("server started at", process.env.PORT))
    })
    .catch((error) => {
        console.log("Error occurred", error)
    })

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