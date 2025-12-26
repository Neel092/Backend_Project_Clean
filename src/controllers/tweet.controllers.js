import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.models.js"
import { User } from "../models/user.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body;

    if (typeof content !== "string" || content.trim().length === 0) {
        throw new ApiError(400, "Tweet content is required");
    }

    if (content.length > 280) {
        throw new ApiError(400, "Tweet exceeds character limit");
    }

    // if (!req.user) {
    //     throw new ApiError(401, "Unauthorized");
    // } iska koi need nhi hai kyuki middleware dekh leta hai yeh sab cheez

    const tweet = await Tweet.create({
        content: content.trim(),
        owner: req.user._id
    })

    return res
        .status(201)
        .json(new ApiResponse(201, tweet, "Tweet is created"));

});

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets

    if (!req.user) {
        throw new ApiError(401, "Unauthorized");
    }

    const { page = 1, limit = 10 } = req.query;

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.min(Math.max(Number(limit), 1), 50);
    const skip = (pageNumber - 1) * limitNumber;

    // const tweets = await Tweet.find({ owner: req.user._id })
    //     .sort({ createdAt: -1 })
    //     .skip(skip)
    //     .limit(limitNumber)

    const [tweets, totalTweets] = await Promise.all([
        Tweet.find({ owner: req.user._id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNumber),
        Tweet.countDocuments({ owner: req.user._id })
    ]);

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            {
                tweets,
                pagination: {
                    totalTweets,
                    currentPage: pageNumber,
                    totalPages: Math.ceil(totalTweets / limitNumber),
                    limit: limitNumber
                }
            }
            , "User tweets fetched successfully"
        ));
});

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet Id");
    }

    // const tweet = await Tweet.findById(tweetId);

    // if (!tweet) {
    //     throw new ApiError(404, "Tweet not found");
    // }

    // if (!req.user || req.user._id.toString() !== tweet.owner.toString()) {
    //     throw new ApiError(404, "Your are not allowed to update this tweet");
    // }

    const { content } = req.body;

    if (typeof content !== "string" || content.trim().length === 0) {
        throw new ApiError(400, "Content is required");
    }

    // tweet.content = content.trim();
    // await tweet.save();

    const updatedtweet = await Tweet.findOneAndUpdate(
        {
            _id: tweetId,
            owner: req.user._id, // owner+existence check together
        },
        {
            $set: {
                content: content.trim()
            }
        },
        {
            new: true, // return updated document
            runValidators: true,// enforce schema rules
        }
    )

    if (!updatedtweet) {
        throw new ApiError(403, "You are not allowed to update the tweet");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedtweet, "Tweet updated successfully"));

});

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet Id");
    }

    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    if (!req.user || req.user._id.toString() !== tweet.owner.toString()) {
        throw new ApiError(403, "Your are not allowed to delete this tweet");
    }

    // await tweet.deleteOne();
    const deletedTweet = await Tweet.findOneAndDelete({
        _id: tweetId,
        owner: req.user._id,
    });

    if (!deletedTweet) {
        throw new ApiError(403, "You are not allowed to delete this tweet");
    }


    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Tweet deleted successfully"));
});

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}