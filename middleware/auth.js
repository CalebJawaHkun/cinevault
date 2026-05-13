import { clerkClient } from "@clerk/express";

export const protectAdmin = async (req, res, next) => {
    try {
        const { userId } = req.auth()
        const user = await clerkClient.user.getUser(userId)

        if(user.privateMetaData.role !== 'admin')
            return res.status(401).json({success: false, message: 'Not Authorized!'})


        next()
    } catch(err) {
        return res.status(401).json({success: false, message: 'Not Authorized!'})
    }
} 