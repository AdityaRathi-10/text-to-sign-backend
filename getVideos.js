require("dotenv").config({
    path: "./.env"
})

const cloudinary = require("cloudinary").v2

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

async function getVideosFromCloudinary(words) {
    const urls = [];
    for (const word of words) {
        const url = `https://res.cloudinary.com/dmmlsf8wm/video/upload/gestura-videos/${word}.mp4`
        try {
            const res = await fetch(url)
            if(res.ok) {
                urls.push({
                    videoUrl: res.url,
                    word: word
                })
            }
            else {
                const chars = word.split("")
                for (const char of chars) {
                    const charUrl = `https://res.cloudinary.com/dmmlsf8wm/video/upload/gestura-videos/${char}.mp4`
                    try {
                        const charRes = await fetch(charUrl)
                        if(charRes.ok) {
                            urls.push({
                                videoUrl: charRes.url,
                                word: char
                            })
                        }
                    } catch (charError) {
                        console.log("Char Error: ", charError)
                    }
                }
            }
        } catch (error) {
            console.log("Word Error: ", error)
        }
    }
    return urls
}

module.exports = {
    getVideosFromCloudinary
}