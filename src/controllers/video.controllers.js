import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.models.js"
import { User } from "../models/user.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.min(Math.max(Number(limit), 10), 50);
    const skip = (pageNumber - 1) * limitNumber;

    const filter = { isPublished: true };

    if (filter) {
        filter.owner = userId;
    }

    if (query) {
        filter.query = { $regex: query, $options: "i" };
    }


    const sort = {};

    if (sortBy) {
        sort[sortBy] = sortType === "asc" ? 1 : -1;
    }
    else {
        sort.createdAt = -1;
    }





    const [videos, totalVideos] = await Promise.all([
        Video.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limitNumber),


        Video.countDocuments(filter)
    ]);

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            {
                videos,
                pagination: {
                    totalVideos,
                    currentpage: pageNumber,
                    totalpages: Math.ceil(totalVideos / limitNumber),
                    limit: limitNumber,
                }
            }
            , "videos are fetched successfully"
        ));

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    const videofile = req.files?.videofile[0]?.path;
    const thumbnail = req.files?.thumbnail[0]?.path;
    // TODO: get video, upload to cloudinary, create video
    const owner = req.user._id;

    if (!(videofile && thumbnail)) {
        throw new ApiError(400, "Videofile AND Thumbnail are required");
    }

    if (!(title && description)) {
        throw new ApiError(400, "Title and Description are required");
    }

    const uploadVideoFile = await uploadOnCloudinary(videofile);
    const uploadThumbnail = await uploadOnCloudinary(thumbnail);

    if (!(uploadThumbnail && uploadVideoFile)) {
        throw new ApiError(400, "Failed to upload Video and Thumbnail");
    }

    const videoPayLoad = await Video.create({
        videofile: uploadVideoFile.secure_url,
        thumbnail: uploadThumbnail.secure_url,
        title,
        description,
        duration: uploadVideoFile.duration,
        owner: owner
    });

    return res
        .status(201)
        .json(new ApiResponse(201, videoPayLoad, "published the video"));
})

const getVideoById = asyncHandler(async (req, res) => {

    /*  1. Extract videoId
        2. If videoId is invalid -> 400
        3. Fetch video from DB
        4. If not found -> 404
        5. If video is published -> allow
        6. If not published:
            if requester is owner-> allow
            else -> 404
        7. increment view count
        8. Return video
    */
    const { videoId } = req.params
    //TODO: get video by id

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "video not found");
    }

    if (!video.isPublished) {
        if (!req.user || req.user._id.toString() !== video.owner.toString()) {
            throw new ApiError(404, "Video Not Found");
        }
    }
    if (
        video.isPublished &&
        req.user &&
        req.user._id.toString() !== video.owner.toString()
    ) {
        video.view += 1;
        await video.save();
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video, "video found"));


})

const updateVideo = asyncHandler(async (req, res) => {

    /*
  1. Extract videoId
  2. Validate ObjectId
  3. Fetch video
  4. If not found ->404
  5. If requester is not owner -> 404
  6. update the video 
  7. Return success response 
  */


    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video Id");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video Not Found");
    }

    if (!req.user || req.user._id.toString() !== video.owner.toString()) {
        throw new ApiError(404, "Video Not Found")
    }

    const { title, description } = req.body;
    const thumbnailPath = req.files?.thumbnail[0]?.path;

    if (!title && !description && !thumbnailPath) {
        throw new ApiError(400, "At least one field is required to update");
    }

    if (title) video.title = title;
    if (description) video.description = description;

    if (thumbnailPath) {
        const uploadedThumbnail = await uploadOnCloudinary(thumbnailPath);

        if (!uploadedThumbnail?.secure_url) {
            throw new ApiError(500, "Error while uploading thumbnail");
        }

        video.thumbnail = uploadedThumbnail.secure_url;
    }


    await video.save();

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video updated successfully"));
})

const deleteVideo = asyncHandler(async (req, res) => {
    /*
   1. Extract videoId
   2. Validate ObjectId
   3. Fetch video
   4. If not found ->404
   5. If requester is not owner -> 404
   6. delete the video 
   7. Return success response 
   */

    const { videoId } = req.params
    //TODO: delete video

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video Id");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video Not Found");
    }

    if (!req.user || req.user._id.toString() !== video.owner.toString()) {
        throw new ApiError(404, "Video Not Found")
    }

    // await Video.findByIdAndDelete(videoId);
    await video.deleteOne();

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "video is deleted successfully"))

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    /*
    1. Extract videoId
    2. Validate ObjectId
    3. Fetch video
    4. If not found ->404
    5. If requester is not owner -> 404
    6. Toggle isPublished
    7. Save video
    8. Return updated video
    */

    const { videoId } = req.params
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video Id");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video Not Found");
    }

    if (!req.user || req.user._id.toString() !== video.owner.toString()) {
        throw new ApiError(404, "Video Not Found")
    }

    video.isPublished = !video.isPublished;
    await video.save();

    return res
        .status(200)
        .json(200, video, "Publish status updated")


})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}