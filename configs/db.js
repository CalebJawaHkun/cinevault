import mongoose from "mongoose";

const connectDB = async () => {
    try {
        mongoose.connection.on('connected', 
            () => console.log("MongoDB database connection Established!")
        )
        await mongoose.connect(`${process.env.MONGODB_URI}/ticketback`)
    } catch(err) {
        console.log(err.message)
    }
}

export default connectDB