import Booking from "../models/Booking.js"
import { clerkClient } from "@clerk/express"
import Movie from "../models/Movie.js"


// Get User Bookings
export const getUserBookings = async (req, res) => {
    try {
        const user = req.auth().userId
        const bookings = await Booking
            .find({user})
            .populate({
                path: "show",
                populate: {path: "movie"}
            })
            .sort({createdAt: -1})

            res.json({success: true,  bookings})
    } catch(err) {
        console.error(err)
        res.status(400).json({success: false, message: err.message})
    }
}


//  Add favourite movie in clerk user metadata
export const updateFavorite = async (req, res) => {
    try {
        const { movieId } = req.body;
        const userId = req.auth().userId;

        const user = await clerkClient.users.getUser(userId)

        if(!user.privateMetadata.favorites){
            user.privateMetadata.favorites = []
        }

        if(!user.privateMetadata.favorites.includes(movieId)){
            user.privateMetadata.favorites.push(movieId)
        } else {
            user.privateMetadata.favorites = user.privateMetadata.favorites
            .filter(item => item !== movieId)
        }

        await clerkClient.users.updateUserMetadata(
            userId, {
            privateMetadata: user.privateMetadata
        })

        res.json({success: true, message: "Favorite movies updated" })
    } catch(err) {
        console.error(err)
        res.status(400).json({success: false, message: err.message})
    }
}

//  Ad favourite movie in clerk user metadata
export const getFavorites = async (req, res) => {
    try {
        const user = await clerkClient.users.getUser(req.auth().userId)
    
        const favorites = user.privateMetadata.favorites;

        // Getting movies from database
        const movies = await Movie.find({_id: {$in: favorites}})

        res.json({success: true, movies})
    } catch(err) {
        console.error(err)
        res.status(400).json({success: false, message: err.message})
    }
}