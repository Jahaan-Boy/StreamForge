import mongoose from "mongoose";

const commentSchema=  new mongoose.Schema({
    text:{
        type:String,
        required:true,
        maxLength:1000,
        trim: true
    },
    video:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Video',
        required:true
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    parent:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Comment',
        default: null
    },
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],

    dislikes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }]
},{timestamps:true});

export const Comment= mongoose.model('Comment',commentSchema);

