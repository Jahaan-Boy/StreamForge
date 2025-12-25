import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

const getSubscriberCount = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    const count = await Subscription.countDocuments({
        channel: channelId,
    });

    return res.status(200).json(
        new ApiResponse(200, { subscribers: count }, "Subscriber count fetched")
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

export{
    toggleSubscription,
    getSubscriberCount,
    getOwnSubscriptions
}