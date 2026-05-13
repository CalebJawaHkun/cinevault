import Show from "../models/Show.js";
import Booking from "../models/Booking.js";

// check avialability of Selected Seats
const checkSeatsAvailability = async (showId, selectedSeats) => {
    try {
        const showData = await Show.findById(showId)
        if(!showData) return false

        const occupiedSeats = showData.occupiedSeats
        const isAnySeatTaken = selectedSeats
            .some(seat => occupiedSeats(seat))

        return !isAnySeatTaken
    } catch(err) {
        console.log(err.message)
        return false
    }
}

export const createBooking = async (req, res) => {
    try {
        const {userId} = req.auth()
        const {showId, selectedSeats} = req.body

        const {origin} = req.headers

        const isAvailable = await checkSeatsAvailability(showId, selectedSeats)
        if(!isAvailable)
            return res.status(400).json({success: false, message: "Selected Seats are not available."})

        const showData = await Show.findById(showId).populate('movie')
        const booking = await Booking.create({
            user: userId,
            show: showId,
            amount: showData.showPrice * selectedSeats.length,
            bookedSeats: selectedSeats
        })

        selectedSeats.map(seat => {
            showData.occupiedSeats[seat] = userId
        })

        showData.markModified('occupiedSeats')
        await showData.save()


        res.json({success: true, message: 'Booked Successfully'})

    } catch(err) {
        console.error(err)
        res.status(400).json({success: false, message: err.message})
    }
}

export const getOccupiedSeats = async (req, res) => {
    try {
        const {showId} = req.params;
        const showData = await Show.findById(showId)

        const occupiedSeats = Object.keys(showData.occupiedSeats)

        res.json({success: true, occupiedSeats})
    } catch(err) {
        console.error(err)
        res.status(400).json({success: false, message: err.message})
    }
}