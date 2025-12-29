import mongoose, { mongo, Schema } from "mongoose";

const subscriptionSchema = new Schema({

    subscriber: {
        type: Schema.Types.ObjectId,// One who is Subscribing
        ref: "User"
    },
    channel: {
        type: Schema.Types.ObjectId,// one to whom 'subscriber' is subscribing
        ref: "User"
    },


}, { timestamps: true });

subscriptionSchema.index(
    { subscriber: 1, channel: 1 },
    { unique: true }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema)