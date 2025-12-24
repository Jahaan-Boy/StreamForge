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

const reactToComment= asyncHandler(async(req,res)=>{
    const { commentId } =req.params;
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

    const updatedComment= await Comment.findByIdAndUpdate(
        commentId,
        query,
        { new: true }
    );

    if (!updatedComment) {
        throw new ApiError(404, "Comment not found");
    }

    return res.status(200).json(
        new ApiResponse(200, updatedComment, `Comment ${action}d successfully`)
    );
});

const editComment=asyncHandler(async(req,res)=>{
    const userId= req.user._id;
    const {message} =req.body
    const {commentId} =req.params;
    if(!message || !message.trim()){
        throw new ApiError(400,"Comment must contain a message");
    }

    const updatedComment = await Comment.findOneAndUpdate(
        { _id: commentId, owner: userId},
        { $set: { text: message.trim() }},
        { new: true }
  );

    if (!updatedComment) {
        throw new ApiError(404, "Comment not found or not authorized");
    }

    return res.status(200).json(new ApiResponse(200,updatedComment,"Comment edited successfully"));
})

export{
    newComment,
    replytoComment,
    reactToComment,
    editComment
}