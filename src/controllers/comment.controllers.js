import { isValidObjectId } from "mongoose"
import { Comment } from "../models/comment.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.models.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video Id");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }


    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.min(Math.max(limit, 1), 50);
    const skip = (pageNumber - 1) * limitNumber;

    const comments = await Comment.find({ video: videoId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber);

    return res
        .status(200)
        .json(
            new ApiResponse(200, comments, "Comments fetched successfully")
        );
});

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video Id");
    }

    const { content } = req.body;

    if (typeof content !== "string" || content.trim().length === 0) {
        throw new ApiError(400, "Comment content is required");
    }

    if (!req.user) {
        throw new ApiError(401, "Unauthorized");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    const comment = await Comment.create({
        video: videoId,
        content: content.trim(),
        owner: req.user._id
    })

    return res
        .status(201)
        .json(new ApiResponse(201, comment, "Comment created successfully"));

});

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment Id");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (!req.user || (req.user._id.toString() !== comment.owner.toString())) {
        throw new ApiError(404, "Comment Not Found");
    }

    const { content } = req.body;

    if (typeof content !== "string" || content.trim().length === 0) {
        throw new ApiError(400, "Comment content is required");
    }

    comment.content = content.trim();
    await comment.save();

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            {
                _id: comment._id,
                content: comment.content,
                updatedAt: comment.updatedAt
            }
            , "comment is updated"
        ));


});

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment

    /**
     *  1. Extract commentId from params
        2. Validate commentId (ObjectId)
        3. Fetch comment from DB
        4. If comment not found -> 404
        5. If requester is not comment.owner -> 404
        6. Delete comment
        7. Return success response
    */
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment Id")
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (!req.user || (req.user._id.toString() !== comment.owner.toString())) {
        throw new ApiError(404, "Comment Not Found");
    }

    await comment.deleteOne();

    return res
        .status(200)
        .json(new ApiResponse(200, {

        }, "comment is deleted"));

});

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
};