import mongoose from "mongoose"
import { Video } from "../models/video.models.js";
import { Subscription } from "../models/subscription.models.js";
import { Like } from "../models/like.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    if (!req.user) {
        throw new ApiError(400, "unauthorized");
    }



    const [totalVideos, totalSubscribers, totalViewsAgg, totalLikesAgg] = await Promise.all([
        Video.countDocuments(
            {
                owner: req.user._id,
            }),

        Subscription.countDocuments(
            {
                channel: req.user._id,
            }),

        Video.aggregate(
            [
                { $match: { owner: req.user._id } },
                {
                    $group: {
                        _id: null,
                        totalViews: { $sum: "$view" }
                    }
                }

            ]),

        Like.aggregate(
            [
                {
                    $lookup: {
                        from: "videos",
                        localField: "video",
                        foreignField: "_id",
                        as: "videoData"
                    }
                },
                {
                    $unwind: "$videoData"
                },
                {
                    $match: {
                        "video.owner": req.user_id,
                    }
                },
                {
                    $count: "totalLikes"
                }
            ])

    ]);

    const totalViews = totalViewsAgg[0]?.totalViews || 0;
    const totalLikes = totalLikesAgg[0]?.totalLikes || 0;

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                totalVideos,
                totalSubscribers,
                totalViews,
                totalLikes
            },
            "Channel stats fetched successfully"
        )
    );

});

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel

    if (!req.user) {
        throw new ApiError(400, "unauthorized");
    }

    const channelId = req.user._id;

    const { page = 1, limit = 10 } = req.query;

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.min(Math.max(Number(limit), 10), 50);
    const skip = (pageNumber - 1) * limitNumber;

    const [videos, totalVideos] = await Promise.all([
        Video.findOne({
            owner: channelId,
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNumber)
        ,
        Video.countDocuments({
            owner: channelId,
        })
    ])

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            {
                videos,
                totalVideos
            }
            , "Channel videos fetched successfully"))

});

export {
    getChannelStats,
    getChannelVideos
};