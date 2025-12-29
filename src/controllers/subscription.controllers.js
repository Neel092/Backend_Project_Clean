import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


// const toggleSubscription = asyncHandler(async (req, res) => {
//     const { channelId } = req.params
//     // TODO: toggle subscription

//     if (!isValidObjectId(channelId)) {
//         throw new ApiError(400, "Invalid channel id");
//     }

//     const channel = await User.findById(channelId);

//     if (!channel) {
//         throw new ApiError(404, "Channel not found");
//     }

//     if (!req.user || req.user._id.toString() === channelId.toString()) {
//         throw new ApiError(400, "You cannot subscribe to yourself");
//     }

//     const existingSubscription = await Subscription.findOneAndDelete({
//         subscriber: req.user._id,
//         channel: channelId
//     })

//     if (existingSubscription) {
//         return res
//             .status(200)
//             .json(new ApiResponse(200, {}, "Unsubscribed successfully"));
//     }

//     await Subscription.create(
//         {
//             subscriber: req.user._id,
//             channel: channelId
//         }
//     )


//     return res
//         .status(200)
//         .json(new ApiResponse(200, {}, "Subscribed successfully"))

// });

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel id");
    }

    if (req.user._id.equals(channelId)) {
        throw new ApiError(400, "You cannot subscribe to yourself");
    }

    const channelExists = await User.exists({ _id: channelId });
    if (!channelExists) {
        throw new ApiError(404, "Channel not found");
    }

    // Try unsubscribe first (atomic)
    const deleted = await Subscription.findOneAndDelete({
        subscriber: req.user._id,
        channel: channelId,
    });

    if (deleted) {
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Unsubscribed successfully"));
    }

    // Subscribe (DB index guarantees safety)
    await Subscription.create({
        subscriber: req.user._id,
        channel: channelId,
    });

    return res
        .status(201)
        .json(new ApiResponse(201, {}, "Subscribed successfully"));
});


// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel id");
    }

    // const channel = await User.findById(channelId);
    const channelExists = await User.exists({ _id: channelId });

    if (!channelExists) {
        throw new ApiError(404, "channel not found");
    }
    const { page = 1, limit = 10 } = req.query;

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.min(Math.max(Number(limit), 10), 50);
    const skip = (pageNumber - 1) * limitNumber;

    const [subscribers, totalSubscribers] = await Promise.all([
        Subscription.find(
            {
                channel: channelId,
            }
        )
            .populate({ path: "subscriber" })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNumber),
        Subscription.countDocuments(
            {
                channel: channelId
            }
        )
    ]);

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            {
                subscribers: subscribers.map(s => s.subscriber),
                pagination: {
                    totalSubscribers,
                    currentPage: pageNumber,
                    totalPages: Math.ceil(totalSubscribers / limitNumber),
                    limit: limitNumber
                }
            },
            "Subscribers fetched successfully"
        ));

});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {

    if (!req.user) {
        throw new ApiError(401, "Unauthorized");
    }

    const { page = 1, limit = 10 } = req.query;

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.min(Math.max(Number(limit), 10), 50);
    const skip = (pageNumber - 1) * limitNumber;

    const [SubscribedChannels, totalSubscribedChannels] = await Promise.all([
        Subscription.find(
            {
                subscriber: req.user._id,
            })
            .populate({ path: "channel" })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNumber),

        Subscription.countDocuments(
            {
                subscriber: req.user._id,
            }
        )
    ]);

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            {
                channels: SubscribedChannels.map(SubscribedChannel => SubscribedChannel.channel),
                pagination: {
                    totalSubscribedChannels,
                    currentPage: pageNumber,
                    totalPages: Math.ceil(totalSubscribedChannels / limitNumber),
                    limit: limitNumber
                }
            },
            "SubscribedChannels Fetch"
        ))


});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}