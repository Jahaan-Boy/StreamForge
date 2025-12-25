import { Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";

const uploadVideo = asyncHandler(async (req, res) => {
        const videoLocalPath = req.files?.video?.[0]?.path;
        const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

        const { title, description } = req.body;

        if (!videoLocalPath) {
            throw new ApiError(400, "Video file is missing");
        }

        if (!thumbnailLocalPath) {
            throw new ApiError(400, "Thumbnail file is missing");
        }

        const videoUploadResponse = await uploadOnCloudinary(videoLocalPath, {
            resourceType: "video",
        });

        const thumbnailUploadResponse = await uploadOnCloudinary(thumbnailLocalPath, {
            resourceType: "image",
        });

        if (!videoUploadResponse) {
            throw new ApiError(400, "Video upload failed");
        }

        if (!thumbnailUploadResponse) {
            throw new ApiError(400, "Thumbnail upload failed");
        }

        const newVideo = await Video.create({
            videoFile: videoUploadResponse.secure_url,
            thumbnail: thumbnailUploadResponse.secure_url,
            title,
            description,
            owner: req.user._id,
            duration: videoUploadResponse.duration,
        });

        return res.status(201).json({
            success: true,
            message: "Uploaded successfully",
            video: newVideo,
        });
});

const openVideo = asyncHandler(async (req, res) => {
        const { videoId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(videoId)) {
            throw new ApiError(400, "Invalid video ID");
        }

        const video = await Video.findByIdAndUpdate(
            videoId,
            {
            $inc: { views: 1 },
            },
            {
            new: true,
            select: "-__v",
            }
        );

        if (!video) {
            throw new ApiError(404, "Video not found");
        }

        if (req.user?._id) {
            await User.findByIdAndUpdate(
            req.user._id,
            {
                $addToSet: {
                watchHistory: video._id,
                },
            },
            { new: false }
            );
        }
        return res.status(200).json(new ApiResponse(200,video,"Video opened successfully"));
});

const reactToVideo=asyncHandler(async(req,res)=>{
  const { videoId } =req.params;
  const { action } =req.body;
  const userId =req.user._id;

  const actionsAllowed = new Set(["like", "dislike"]);

  if (!actionsAllowed.has(action)) {
  throw new ApiError(400, "Invalid action");
  }

  let query;

  if (action === "like") {
    query= {
    $addToSet:{ likes: userId },
    $pull:{ dislikes: userId }
    };
  } else {
    query= {
    $addToSet:{ dislikes: userId },
    $pull:{ likes: userId }
    };
  }

  const updatedVideo= await Video.findByIdAndUpdate(
    videoId,
    query,
    { new: true }
  );

  if (!updatedVideo) {
    throw new ApiError(404, "Video not found");
  }

  return res.status(200).json(
    new ApiResponse(200, updatedVideo, `Video ${action}d successfully`)
  );
})

const getChannelVideos = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  const videos = await Video.find({
    owner: channelId,
  })

  return res.status(200).json(
    new ApiResponse(200, videos, "Channel videos fetched")
  );
});


const getVideoDetails = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const video = await Video.findById(videoId)
    .populate("owner", "username avatar");

  if (!video || !video.isPublished) {
    throw new ApiError(404, "Video not found");
  }

  return res.status(200).json(
    new ApiResponse(200, video, "Video details fetched")
  );
});

export {
    reactToVideo,
    uploadVideo,
    getChannelVideos,
    openVideo,
    getVideoDetails
}