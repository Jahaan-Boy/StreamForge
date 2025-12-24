import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";

const newComment= asyncHandler(async(req,res)=>{
    const {videoId}=req.params;
    const ownerId=req.user._id;
    const {message}=req.body;
    if(!message || !message.trim()){
        throw new ApiError(400,"Must contain a message");
    }

    const video=await Video.findById(videoId);
    
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    
    await Video.findByIdAndUpdate(videoId, {
        $inc: { commentsCount: 1 }
    });

    const newComment= await Comment.create({
        text:message.trim(),
        owner:ownerId,
        video:videoId,
    })

    await Video.findByIdAndUpdate(videoId, {
        $inc: { commentsCount: 1 }
    });

    return res.status(201).json(new ApiResponse(201,newComment,"Comment created successfully"));
})

const replytoComment= asyncHandler(async(req,res)=>{
    const {videoId,commentId}=req.params;
    const ownerId=req.user._id;
    const {message}=req.body;
    if(!message || !message.trim()){
        throw new ApiError(400,"Must contain a message");
    }

    const video=await Video.findById(videoId);
    
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    

    const parentComment = await Comment.findById(commentId);
    if (!parentComment) {
        throw new ApiError(404, "Parent comment not found");
    }

    const reply= await Comment.create({
        text:message.trim(),
        owner:ownerId,
        video:videoId,
        parent:commentId
    })

    await Video.findByIdAndUpdate(videoId, {
        $inc: { commentsCount: 1 }
    });

    return res.status(201).json(new ApiResponse(201,reply,"Comment replied successfully"));
})

const likeComment=asyncHandler(async(req,res)=>{
    const {commentId}=req.params;
    const userId= req.user._id;

    const comment=await Comment.findById(commentId);
    
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    const updatedComment= Comment.findByIdAndUpdate(commentId,{
        $addToSet: {likes: userId},
        $pull:{dislikes: userId},  
    },{new: true})

    return res.status(200).json(new ApiResponse(200, updatedComment, "Comment liked successfully")
  );
})

const dislikeComment=asyncHandler(async(req,res)=>{
    const {commentId}=req.params;
    const userId= req.user._id;

    const comment=await Comment.findById(commentId);
    
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    const updatedComment= Comment.findByIdAndUpdate(commentId,{
        $addToSet: {dislikes: userId},
        $pull:{likes: userId},  
    },{new: true})

    return res.status(200).json(new ApiResponse(200, updatedComment, "Comment liked successfully")
  );
})


export{
    newComment,
    replytoComment,
    likeComment,
    dislikeComment,
}