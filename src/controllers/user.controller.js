import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import  jwt  from 'jsonwebtoken'
import mongoose from 'mongoose'
import { Video } from '../models/video.model.js'
import {Subscription} from '../models/subscription.model.js'

const generateAccessAndRefreshTokens=async(userId)=>{
    try{
        const user=await User.findById(userId);
        const accessToken=await user.generateAccessToken();
        const refreshToken=await user.generateRefreshToken();

        user.refreshToken=refreshToken;
        await user.save({validateBeforeSave: false})

        return {accessToken,refreshToken}


    }catch(error){
        throw new ApiError(500,"Something went wrong while generating refresh or access token");
    }
}

const registerUser=asyncHandler( async (req,res)=>{
    // get user details from frontend 
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refreshToken field from response
    // check for user creation
    // return res

    const {fullName, email, username, password} = req.body
    if(
        [fullName,email,username,password].some((field)=>field?.trim()==="")
    ){
        throw new ApiError(400,"All fields are compulsory")
    }

    const existedUser=await User.findOne({
        $or:[{username},{email}]
    })

    if(existedUser){
        throw new ApiError(409,"User with email or username already exists");
    }

    const avatarLocalPath=req.files?.avatar[0]?.path;
    //const coverImageLocalPath=req.files?.coverImage[0].path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath=req.files.coverImage[0].path;
    }

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required");
    }

    const avatar=await uploadOnCloudinary(avatarLocalPath)
    const coverImage=await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400,"Avatar file is required");
    }


    const user=await User.create({
        fullName:fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })

    const createdUser=await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered successfully")
    )
})
    const loginUser=asyncHandler(async (req,res)=>{
        //req.body-- data
        // username or email
        // find the user
        // password check
        // access and refresh token
        // send cookies
        const {email,username,password}= req.body;
        if(!username && !email){
            throw new ApiError(400,"username or password is required");
        }
        const user = await User.findOne({
            $or:[{username},{email}]
        })

        if(!user){
            throw new ApiError(404,"User does not exist");
        }

        const isPasswordValid= await user.isPasswordCorrect(password);

        if(!isPasswordValid){
            throw new ApiError(401,"Invalid user credentials");
        }

        const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id)

        const loggedInUser =await User.findById(user._id).select("-password -refreshToken")

        const options={
            httpOnly:true,
            secure: true
        }
        return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).json(
            new ApiResponse(
                200,
                {
                    user:loggedInUser,accessToken,
                    refreshToken
                },
                "User logged in successfully"
            )
        );


    })

    const logoutUser=asyncHandler(async(req,res)=>{
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $set:{
                    refreshToken:undefined
                }
            },
            {
                new:true
            }
        )
        
        const options={
            httpOnly:true,
            secure: true
        }

        return res.
        status(200).
        clearCookie("accessToken",options).
        clearCookie("refreshToken",options).
        json(new ApiResponse(200,{}, "user successfully logged out"));

    })

    const refreshAccessToken= asyncHandler(async (req,res)=>{
        const incomingRefreshToken= req.cookies.refreshAccessToken || req.body.refreshAccessToken;
        if(!incomingRefreshToken){
            throw new ApiError(401,"Unautorized request");
        }
        try {
            const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);
            const user = await User.findById(decodedToken?._id);
    
            if(!user){
                throw new ApiError(401,"Invalid refresh token");
            }
    
            if(incomingRefreshToken!==user?.refreshToken){
                throw new ApiError(401,"Refresh token is expired or used");
            }
    
            const options={
                httpOnly:true,
                secure:true
            }
    
            const {refreshToken:newRefreshToken,accessToken}=await generateAccessAndRefreshTokens(user._id);
    
            return res.status(200).
            cookie("accessToken",accessToken,options).
            cookie("refreshToken",newRefreshToken,options).
            json(
                new ApiResponse(
                    200,
                    {accessToken,refreshToken: newRefreshToken},
                    "Access Token refreshed"
                )
            );
        } catch (error) {
            throw new ApiError(401,error?.message || "Invalid refresh token");
        }
    })


    const changeCurrentPassword=asyncHandler(async(req,res)=>{
        const {oldPassword, newPassword}=req.body;

        const user=await User.findById(req.user?._id);
        const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

        if(!isPasswordCorrect){
            throw new ApiError(400,"Invalid old password");
        }

        user.password=newPassword;
        await user.save({validateBeforeSave:false});
    
        return res.status(200).
        json(new ApiResponse(200, {}, "Password changed successfully"));

    })

    const getCurrentUser=asyncHandler(async(req,res)=>{
        return res.status(200).
        json(new ApiResponse(200,req.user,"Current user fetched successfully"))
    })

    const updateAccountDetails=asyncHandler(async(req,res)=>{
        const {fullName,email}=req.body;

        if(!fullName || !email){
            throw new ApiError(400,"All fields are required");
        }

        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set:{
                    fullName:fullName,
                    email:email
                }
            },
            {new:true})
            .select("-password");

            return res.status(200).
            json(new ApiResponse(200,user,"Account details updated successfully"))
    })

    const updateUserAvatar= asyncHandler(async(req,res)=>{
        const avatarLocalPath= req.file?.path;

        if(!avatarLocalPath){
            throw new ApiError(400,"Avatar file is missing");
        }

        const avatar = await uploadOnCloudinary(avatarLocalPath);

        if(!avatar.url){
            throw new ApiError(400,"Error while uploading on avatar");
        }

        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set:{
                    avatar: avatar.url
                }
            },
            {new:true},
        ).select("-password")
        return res.status(200).
        json(
            new ApiResponse(200,user,"Avatar updated successfully")
        )
    })

    const updateUserCoverImage= asyncHandler(async(req,res)=>{
        const coverImageLocalPath= req.file?.path;

        if(!coverImageLocalPath){
            throw new ApiError(400,"Cover Image file is missing");
        }

        const coverImage = await uploadOnCloudinary(coverImageLocalPath);

        if(!coverImage.url){
            throw new ApiError(400,"Error while uploading on coverImage");
        }

        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set:{
                    coverImage: coverImage.url
                }
            },
            {new:true},
        ).select("-password")
        return res.status(200).
        json(
            new ApiResponse(200,user,"CoverImage updated successfully")
        )
    })

    const getUserChannelProfie = asyncHandler(async(req,res)=>{
        const {username} = req.params;

        if(!username?.trim()){
            throw new ApiError(400,"Username is missing")
        }

        const channel = await User.aggregate([
        {
            $match:{
                username: username?.toLowerCase(),
            },
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as:"subscribers"

            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size: "$subscribers"
                },
                channelsSubscribedToCount:{
                    $size: "$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project:{
                fullName:1,
                username:1,
                subscribersCount:1,
                channelsSubscribedToCount:1,
                avatar:1,
                coverImage:1,
                email:1

            }
        }
        ])

        if(!channel?.length){
            throw new ApiError(404,"channel does not exists")
        }

        return res.status(200).
        json(
            new ApiResponse(200,channel[0],"Channel fetched successfully")
        )
    })

    const getWatchHistory = asyncHandler(async(req,res)=>{
        
        const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200).
    json(
        new ApiResponse(200,user[0].watchHistory,"WatchHistory fetched successfully")
    )
    })

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

  const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} =req.params;
    const userId=req.user._id;

    if (channelId.toString()===userId.toString()) {
        throw new ApiError(400, "Cannot subscribe to yourself");
    }

    const existing= await Subscription.findOne({
        subscriber:userId,
        channel:channelId,
    });

    if(existing){
        await existing.deleteOne();
        return res.status(200).json(new ApiResponse(200,{ subscribed: false },"Unsubscribed"));
    }

    await Subscription.create({
        subscriber: userId,
        channel: channelId,
    });

    return res.status(200).json(new ApiResponse(200,{ subscribed: true },"Subscribed"));
});

  const clearWatchHistory = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, {
        $set: { watchHistory: [] },
    });

    return res.status(200).json(
        new ApiResponse(200, {}, "Watch history cleared")
    );
});

const getSubscriberCount = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    const count = await Subscription.countDocuments({
        channel: channelId,
    });

    return res.status(200).json(
        new ApiResponse(200, { subscribers: count }, "Subscriber count fetched")
    );
});

export const getChannelVideos = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  const videos = await Video.find({
    owner: channelId,
  })

  return res.status(200).json(
    new ApiResponse(200, videos, "Channel videos fetched")
  );
});

const getOwnSubscriptions = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const subscriptions = await Subscription.find({
    subscriber: userId,
  }).populate("channel", "username avatar");

  return res.status(200).json(
    new ApiResponse(200, subscriptions, "Subscribed channels fetched")
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
    registerUser,
    loginUser,
    logoutUser, 
    refreshAccessToken, 
    getCurrentUser, 
    changeCurrentPassword, 
    updateAccountDetails, 
    updateUserAvatar, 
    updateUserCoverImage, 
    getUserChannelProfie,
    getWatchHistory,
    uploadVideo,
    openVideo,
    toggleSubscription,
    clearWatchHistory,
    getSubscriberCount,
    getOwnSubscriptions,
    getVideoDetails
};