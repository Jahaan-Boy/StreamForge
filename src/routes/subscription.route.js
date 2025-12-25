import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js"; 
import { toggleSubscription, getSubscriberCount,getOwnSubscriptions } from "../controllers/subscription.controller.js";

const router= Router();

router.route("/subscribe/:channelId").post(verifyJWT, toggleSubscription);

router.route("/subscribers/count/:channelId").get(verifyJWT, getSubscriberCount);

router.route('/my-subscriptions').get(verifyJWT,getOwnSubscriptions);

export default router;