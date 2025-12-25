import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import  jwt  from 'jsonwebtoken'
import mongoose from 'mongoose'
import { Video } from '../models/video.model.js'
import {Subscription} from '../models/subscription.model.js'


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


  const clearWatchHistory = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, {
        $set: { watchHistory: [] },
    });

    return res.status(200).json(
        new ApiResponse(200, {}, "Watch history cleared")
    );
});


export {  
    getCurrentUser, 
    updateAccountDetails, 
    updateUserAvatar, 
    updateUserCoverImage, 
    getUserChannelProfie,
    getWatchHistory,
    clearWatchHistory,
};