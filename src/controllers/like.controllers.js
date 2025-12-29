import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.models.js"
import { Tweet } from "../models/tweet.models.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: toggle like on video
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    const existingLike = await Like.findOne(
        {
            likedby: req.user._id,
            video: videoId
        }
    );

    if (existingLike) {
        await existingLike.deleteOne();

        return res
            .status(200)
            .json(new ApiResponse(200, {}, "video like is removed"));
    }

    await Like.create(
        {
            likedby: req.user._id,
            video: videoId
        }
    )

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "video liked "));

});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    //TODO: toggle like on comment

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment id");
    }

    // const comment = await Video.findById(commentId);

    // if (!comment) {
    //     throw new ApiError(404, "comment not found");
    // }

    // const existingLike = await Like.findOne(
    //     {
    //         likedby: req.user._id,
    //         comment: commentId
    //     }
    // );

    // if (existingLike) {
    //     await existingLike.deleteOne();

    //     return res
    //         .status(200)
    //         .json(new ApiResponse(200, {}, "comment like is removed"));
    // }

    // await Like.create(
    // {
    //     likedby: req.user._id,
    //     video: videoId
    // }
    // )

    // by using this we save DB calls 

    const deletedLike = await Like.findOneAndDelete(
        {
            likedby: req.user._id,
            comment: commentId,
        }
    );

    if (deletedLike) {

        return res
            .status(200)
            .json(new ApiResponse(200, {}, "comment like is removed"));
    }

    await Like.create(
        {
            likedby: req.user._id,
            comment: commentId
        }
    )


    return res
        .status(200)
        .json(new ApiResponse(200, {}, "video liked "));

});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    //TODO: toggle like on tweet

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id");
    }

    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new ApiError(404, "tweet not found");
    }

    const existingLike = await Like.findOne(
        {
            likedby: req.user._id,
            tweet: tweetId
        }
    );

    if (existingLike) {
        await existingLike.deleteOne();

        return res
            .status(200)
            .json(new ApiResponse(200, {}, "tweet like is removed"));
    }

    await Like.create(
        {
            likedby: req.user._id,
            tweet: tweetId
        }
    )

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "tweet liked "));
});

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    // const likedVideos = await Like.find(
    //     {
    //         likedby: req.user._id,
    //         video: { $ne: null }
    //     }
    // )
    //     .populate("video")
    //     .sort({ createdAt: -1 });
    if (!req.user) {
        throw new ApiError(401, "Unauthorized");
    }

    const { page = 1, limit = 10 } = req.query;

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.min(Math.max(limit, 1), 50);
    const skip = (pageNumber - 1) * limitNumber;


    const [likes, totalLikes] = await Promise.all(
        [
            Like.find({
                likedby: req.user._id,
                video: { $exists: true }
            })

                .populate({
                    path: "video",
                    select: "title thumbnail createdAt "
                })
                .sort({ createdAt: -1 })// here order matter 
                .skip(skip)
                .limit(limitNumber),

            Like.countDocuments(
                {
                    likedby: req.user._id,
                    video: { $exists: true }
                })
        ]);



    return res
        .status(200)
        .json(new ApiResponse(
            200,
            {

                videos: likes.map(like => like.video),// this return only videos that are liked till now
                // if this statment is missing then it will return likes: [ { like + video }, { like + video } ]
                // from this statment it will return only   videos: [ video1, video2, ... ],
                pagination: {
                    totalLikes,
                    currentPage: pageNumber,
                    totalPages: Math.ceil(totalLikes / limitNumber),
                    limit: limitNumber,
                },
            },
            "Liked videos fetched"
        ));
});

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}