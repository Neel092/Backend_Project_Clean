import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config()

connectDB()
    .then(() => {

        app.on("Error", (error) => {
            console.log("app connection failed : ", error);
            // throw error;
        })


        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running at port : ${process.env.PORT || 8000}`);

        })
    })
    .catch((error) => {
        console.log("DB connection problem in index.js file : ", error);

    });


/*
import express from "express";
const app = express();

// One of the method to ConnectDB
// function connectDB() { }
// connectDB();

//Second Approach i.e better approach
; (async () => {
    try {
        await mongoose.connect(`${process.env.MONGO_URL}/${DB_NAME}`);
        app.on("Error: ", (error) => {
            console.log("Error: ", error);
            throw error;
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT}`);
        })


    } catch (error) {
        console.log("Error: ", error);
        throw error;
    }
})()
*/ 