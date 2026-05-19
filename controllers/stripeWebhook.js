import stripe from 'stripe'
import Booking from '../models/Booking.js';

export const stripeWebhooks = async (request, response) => {
  const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
  const sig = request.headers["stripe-signature"];

  let event;

  try {
    event = stripeInstance
    .webhooks
    .constructEvent(request.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
    
  } catch (error) {
    return response.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    switch (event.type) {
        case "payment_intent.succeeded": {
            console.log('Payment Stripe webhook ran!')
            const paymentIntent = event.data.object;
            const sessionList = await stripeInstance
            .checkout 
            .sessions
            .list({
              payment_intent: paymentIntent.id
            })

            const session = sessionList.data[0];
            const { bookingId } = session.metadata;

            await Booking.findByIdAndUpdate(bookingId, {
                isPaid: true,
                paymentLink: ""
            })

            // Logic to update booking status in DB would typically follow here
            break;
        }

        default:
            console.log('Unhadled Event. Stripe Webhook: ', event.type);
    }

    response.json({received: true})
  } catch (err) {
    console.error('Webhook proceessing error: ', err)
    response.status(500).send("Internal Server Error")
  }
}