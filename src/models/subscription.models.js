import mongoose from "mongoose";


const subscriptionSchema = new mongoose.Schema({
    subscriber: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    channel: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
}, { timestamps: true })

const Subscription = mongoose.model("Subscription",
    subscriptionSchema)

export default Subscription