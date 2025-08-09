require("dotenv").config({
    path: "./.env"
})

const cloudinary = require("cloudinary").v2
const fs = require("fs")
const path = require("path")

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const folderPath = "./videos"

fs.readdir(folderPath, (err, files) => {
    if(err) {
        console.log("Error reading folder", err)
        return
    }
    files.forEach((file) => {
        const filePath = path.join(folderPath, file)
        const publicId = path.parse(file).name
        
        cloudinary.uploader.upload(filePath, {
            resource_type: "video",
            public_id: `${publicId}`,
            folder: "gestura-videos",
        })
        .then((res) => {
            console.log(`Uploaded ${file} ✅`)
        })
        .catch((error) => {
            console.log(`Error uploading ${file}: `, error)
        })
    })
})