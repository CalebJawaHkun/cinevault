import express from "express"
import { protectAdmin } from "../middleware/auth.js"
import { getAllBookings, getAllShows, getDashboarData, isAdmin } from "../controllers/adminController.js"

const adminRouter = express.Router()
adminRouter.get('/is-admin', protectAdmin, isAdmin)
adminRouter.get('/dashboard', protectAdmin, getDashboarData)
adminRouter.get('/all-shows', protectAdmin, getAllShows)
adminRouter.get('/all-bookings', protectAdmin, getAllBookings)

export default adminRouter