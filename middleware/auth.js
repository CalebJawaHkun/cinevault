import { clerkClient } from "@clerk/express";

export const protectAdmin = async (req, res, next) => {
    try {
        const { userId } = req.auth()
        console.log('User ID:  ', userId)
        const user = await clerkClient.users.getUser(userId)
        const role = user.privateMetadata?.role

        console.log('Auth.js: Current User Role: ', role)
        if(role !== 'admin')
            return res.status(401).json({success: false, message: 'Not Authorized!'})


        next()
    } catch(err) {
        console.log('Admin Route Protector: ' +err.message)
        return res.status(401).json({success: false, message: 'Not Authorized!'})
    }
} 