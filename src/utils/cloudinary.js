import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUDNAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadFile = async (filePath) => {
    try {
        if (!filePath) {
            throw new Error("error in file Path")
        }

        const response = await cloudinary.uploader.upload(filePath, { resource_type: "auto" })

        console.log("file is uploaded on cloudinary \n", response.url)

        return response
    } catch (error) {
        fs.unlinkSync(filePath) //remove locally saved temporary file
        return null
    }
}


export default uploadFile