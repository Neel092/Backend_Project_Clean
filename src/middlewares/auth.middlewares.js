import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.models.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const cookieToken = req.cookies?.accessToken;
        const headerToken = req.headers?.authorization?.startsWith("Bearer ")
            ? req.headers.authorization.replace("Bearer ", "")
            : null;

        const token = cookieToken || headerToken;
        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

        if (!user) {
            throw new ApiError(401, "Invalid AccessToken");
        }

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid AccessToken")
    }


})