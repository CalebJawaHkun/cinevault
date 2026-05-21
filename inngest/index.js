import { Inngest } from "inngest";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import sendEmail from "../configs/nodeMailer.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "my-app" });


// C
const syncUserCreation = inngest.createFunction(
    { id: "synce-user-from-clerk", 
    triggers: [{ event: "clerk/user.created" }] },

    async ({event}) => {
        const {id, first_name, last_name, email_addresses, image_url}
        = event.data

        const userData = {
            _id: id,
            email: email_addresses[0].email_address,
            name: first_name + ' ' +last_name,
            image: image_url
        }

        await User.create(userData)
    }
)

// D
const syncUserDeletion = inngest.createFunction(
    { id: "delete-user-from-clerk", 
    triggers: [{ event: "clerk/user.deleted" }] },
    async ({event}) => {
        const {id} = event.data
        await User.findByIdAndDelete(id)
    }  

)

// U
const syncUserUpdation = inngest.createFunction(
    { id: "update-user-from-clerk", 
    triggers: [{ event: "clerk/user.updated" }] },

    async ({event}) => {
        const {id, first_name, last_name, email_addresses, image_url} = event.data
        const userData = {
            _id: id,
            email: email_addresses[0].email_address,
            name: first_name + ' ' +last_name,
            image: image_url
        }

        await User.findByIdAndUpdate(id, userData)
    }  

)


// Inngest function to cancel booking and release the seats

const releaseSeatsAndDeleteBooking = inngest.createFunction(
    { id: "release-seats-delete-booking", 
    triggers: [{ event: "app/checkpayment" }] },
    async ({ event, step }) => {
        const tenMinutesLater = new Date(Date.now() + 10 * 60 * 1000)

        await step.sleepUntil('wait-for-10-minutes', tenMinutesLater)

        await step.run('check-payment-status', async () => {
            const bookingId = event.data.bookingId
            const booking = await Booking.findById(bookingId)
            

            if(!booking.isPaid) {
                const show = await Show.findById(booking.show)
                booking.bookedSeats.forEach(seat => {
                    delete show.occupiedSeats[seat]
                })

                show.markModified('occupiedSeats')
                await show.save()
                await Booking.findByIdAndDelete(booking._id)
            }

            console.log('Tried running Release Seats and Delete Booking')
            console.log(`Booking id: ${booking._id}. Booking Is Paid: ${booking.isPaid}`)
        })
    }
) 

// Inngest Function to send email when user books a show
const sendBookingConformationEmail = inngest.createFunction(
    { id: "send-booking-cofirmation-email", 
    triggers: [{ event: "app/show.booked" }] },
    async ({event, step}) => {
        const {bookingId} = event.data;
        const booking = await Booking.findById(bookingId).populate({
            path: 'show',
            populate: {path: "movie", model: "Movie"}
        }).populate('user')

        await sendEmail({
            to: booking.user.email,
            subject: `Payment Confirmation: "${booking.show.movie.title}" booked!`,
            body: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 8px;">
                <h2 style="color: #F84565; margin-bottom: 20px;">Woohoo! You're all set, ${booking.user.name}! 🎉</h2>
                
                <p>Guess what? The movie gods have smiled upon you, and your tickets are officially locked, loaded, and waiting for you! Get ready for an amazing time because you're going to see:</p>
                
                <div style="background-color: #fdf2f4; border-left: 4px solid #F84565; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <p style="margin: 0; font-size: 1.2em;">
                        <strong style="color: #F84565;">"${booking.show.movie.title}"</strong>
                    </p>
                    <p style="margin: 10px 0 0 0; font-size: 1em; line-height: 1.5;">
                        📅 <strong>Date:</strong> ${new Date(booking.show.showDateTime).toLocaleDateString('en-US', { timeZone: 'Asia/Yangon' })}<br/>
                        ⏰ <strong>Time:</strong> ${new Date(booking.show.showDateTime).toLocaleTimeString('en-US', { timeZone: 'Asia/Yangon', hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>

                <p><strong>What to do next:</strong></p>
                <ul style="padding-left: 20px; margin-bottom: 20px;">
                    <li style="margin-bottom: 8px;">Double-check the time so you don't miss the trailers (honestly, the best part?).</li>
                    <li style="margin-bottom: 8px;">Start practicing your optimal popcorn-to-mouth coordination.</li>
                    <li style="margin-bottom: 8px;">Bring your phone along to show this confirmation at the venue.</li>
                </ul>

                <p>We are absolutely thrilled to have you watching with us. If you need anything at all or just want to debate movie trivia, our support crew is here for you.</p>
                
                <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 25px 0;" />
                
                <p style="margin-bottom: 5px;">See you at the movies! 🍿🥤</p>
                <p style="strong; color: #F84565; margin-top: 0;"><strong>— The ShowTimeX Team</strong></p>
            </div>`
        })
    }
) 

const sendShowReminders = inngest.createFunction(
    { id: "send-show-reminders",
    cron: "0 */8 * * *"},
    async ({step}) => {   
        const now = new Date();
        const in8Hours = new Date(now.getTime() + 8 * 60 * 60 * 1000);
        const windowStart = new Date(in8Hours.getTime() - 10 * 60 * 1000);

        // Prepare reminder tasks
        const reminderTasks = await step.run(
            "prepare-reminder-tasks", 
            async () => {
                const shows = await Show.find(
                    {showTime: { $gte: windowStart, $lte: in8Hours },}
                ).populate('movie');
                    
                const tasks = [];
                for(const show of shows) {
                    if(!show.movie || !show.occupiedSeats) continue;

                    const userIds = [...new Set(Object.values(show.occupiedSeats))];
                    if(userIds.length === 0) continue;

                    const users = await User.find({_id: {$in: userIds}}).select("name email");

                    for(const user of users){
                        tasks.push({
                            userEmail: user.email,
                            userName: user.name,
                            movieTitle: show.movie.title,
                            showTime: show.showTime,
                        })
                    }
                } 

                return tasks
            }
        )

        if(reminderTasks.length === 0) {
            return {send: 0, message: 'No reminders to send.'}
        }

        const results = await step.run('send-all-reminders', async () => {
            return await Promise.allSettled(
                reminderTasks.map(task => sendEmail({
                    to: task.userEmail,
                    subject: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 8px;">
                        <h2 style="color: #F84565; margin-bottom: 15px;">The countdown is ON, ${task.userName}! ⏰✨</h2>
                        
                        <p>This is your official, ultra-friendly wake-up call! Your cinematic adventure is creeping up fast, and we want to make sure you don't miss a single second of the action. </p>
                        
                        <p>Clear your schedule, tell your friends you're "busy," and get ready because you are seeing:</p>
                        
                        <div style="background-color: #fdf2f4; border-left: 4px solid #F84565; padding: 15px; margin: 20px 0; border-radius: 4px;">
                            <h3 style="color: #F84565; margin: 0 0 10px 0; font-size: 1.3em;">"${task.movieTitle}"</h3>
                            <p style="margin: 0; font-size: 1em; line-height: 1.5;">
                                📅 <strong>Date:</strong> ${new Date(task.showTime).toLocaleDateString('en-US', { timeZone: 'Asia/Yangon', hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>

                        <div style="background-color: #fff9db; border: 1px dashed #fcc419; padding: 12px; text-align: center; border-radius: 6px; margin-bottom: 20px;">
                            🚨 <strong>Tick-tock!</strong> Your show starts in approximately <strong>8 hours</strong>! 
                        </div>

                        <p><strong>Your Pre-Show Checklist:</strong></p>
                        <ul style="padding-left: 20px; margin-bottom: 25px;">
                            <li style="margin-bottom: 8px;">Locate your favorite hoodie/jacket (theater AC is no joke).</li>
                            <li style="margin-bottom: 8px;">Secure the best snacks in advance or plan your concession stand strategy.</li>
                            <li style="margin-bottom: 8px;">Double-check your travel time so you can snag the perfect parking spot.</li>
                        </ul>

                        <p>Have an absolutely spectacular time at the theater! We'll see you there.</p>
                        
                        <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 25px 0;" />
                        
                        <p style="margin-bottom: 5px;">Happy watching! 🍿🎬</p>
                        <p style="color: #F84565; margin-top: 0;"><strong>— The ShowTimeX Team</strong></p>
                    </div>`
                }))
            )
        })

        const sent = results.filter(r => r.status === 'fulfilled').length
        const failed = results.length - sent

        return {
            sent,
            failed,
            message: `Sent ${sent} reminder(s), ${failed} failed.`
        }
    }
) 

const sendNewShowNotifications = inngest.createFunction(
    { id: "send-new-show-notifications", 
    triggers: [{ event: "app/show.added" }] },
    async ({ event }) => {
        const { movieTitle, movieId } = event.data;

        const users = await User.find({});

        for(const user of users){
            const userEmail = user.email;
            const userName = user.name;

            const subject = `🎬 New Show Added: ${movieTitle}`;
            const body = `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 8px;">
                <h2 style="color: #F84565; margin-bottom: 15px;">Look what just dropped, ${userName}! 🎬✨</h2>
                
                <p>Drop everything you're doing (okay, maybe finish your coffee first) because we have some seriously exciting news. Our movie library just got a brand-new upgrade, and we think you're going to love it!</p>
                
                <p>Fresh off the reels and ready for your viewing pleasure, please welcome to the stage:</p>
                
                <div style="background-color: #fdf2f4; border-left: 4px solid #F84565; padding: 20px; margin: 25px 0; text-align: center; border-radius: 6px;">
                    <span style="font-size: 0.9em; text-transform: uppercase; letter-spacing: 2px; color: #F84565; font-weight: bold;">🔥 NEW ARRIVAL 🔥</span>
                    <h3 style="color: #F84565; margin: 10px 0 0 0; font-size: 1.6em; font-weight: 800;">"${movieTitle}"</h3>
                </div>

                <p>Whether you're in the mood for action, drama, or just an excuse to eat a giant bowl of popcorn on a weekday night, this one is absolutely worth adding to your watchlist.</p>
                
                <!-- Clean, cheerful CTA button instead of a plain link -->
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://yourwebsite.com" style="background-color: #F84565; color: #ffffff; padding: 12px 30px; text-decoration: none; font-weight: bold; border-radius: 25px; display: inline-block; box-shadow: 0 4px 6px rgba(248, 69, 101, 0.2);">
                        Snag Your Seats Now 🎟️
                    </a>
                </div>

                <p style="font-size: 0.95em; color: #666666; text-align: center;">Seats fill up fast for new releases, so don't hit snooze on this one!</p>
                
                <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 25px 0;" />
                
                <p style="margin-bottom: 5px;">Happy streaming,</p>
                <p style="color: #F84565; margin-top: 0;"><strong>— The ShowTimeX Team</strong></p>
            </div>`

            await sendEmail({
                to: userEmail,
                subject,
                body
            })
        }

        return {message: 'Notification Sent!'}
    }

)
                
                


// Create an empty array where we'll export future Inngest functions
export const functions = [
    syncUserCreation,
    syncUserDeletion,
    syncUserUpdation,
    releaseSeatsAndDeleteBooking,
    sendBookingConformationEmail,
    sendShowReminders,
    sendNewShowNotifications
];
export {
    syncUserCreation,
    syncUserDeletion,
    syncUserUpdation,
    releaseSeatsAndDeleteBooking,
    sendBookingConformationEmail,
    sendShowReminders,
    sendNewShowNotifications
}