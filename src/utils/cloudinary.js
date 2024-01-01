import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"

// purpose
// 1. store image on local server and after that on cloudinary on successful upload on cloudinary delete from the local server
//2.In case of failer delete from local server 


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUDNAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadFile = async (filePath) => {
    try {
        if (!filePath) {
            throw new Error("error in file Path \n")
        }

        const response = await cloudinary.uploader.upload(filePath, { resource_type: "auto" })

        console.log("\n file is uploaded on cloudinary \n", response)

        fs.unlinkSync(filePath)

        return response
    } catch (error) {
        fs.unlinkSync(filePath) //remove locally saved temporary file
        return null
    }
}


export default uploadFile