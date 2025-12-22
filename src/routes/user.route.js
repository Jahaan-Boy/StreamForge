import { Router } from "express";
import {changeCurrentPassword, clearWatchHistory, getChannelVideos, getCurrentUser, getSubscriberCount, getUserChannelProfie, getWatchHistory, loginUser, logoutUser, openVideo, refreshAccessToken, registerUser, toggleSubscription, updateAccountDetails, updateUserAvatar, updateUserCoverImage, uploadVideo,getOwnSubscriptions, getVideoDetails} from '../controllers/user.controller.js'
import {upload} from '../middlewares/multer.middleware.js'
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router=Router();

router.route('/register').post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser
)

router.route('/login').post(loginUser);

router.route('/logout').post( verifyJWT ,logoutUser);

router.route('/refresh-token').post(refreshAccessToken);

router.route('/change-password').post(verifyJWT,changeCurrentPassword);

router.route('/current-user').get(verifyJWT,getCurrentUser);

router.route('/update-account').patch(verifyJWT,updateAccountDetails);

router.route('/avatar').patch(verifyJWT,upload.single("avatar"),updateUserAvatar);

router.route('/cover-image').patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage);

router.route("/c/:username").get(verifyJWT,getUserChannelProfie);

router.route('/history').get(verifyJWT, getWatchHistory);

router.route("/upload-video").post(verifyJWT,upload.fields([{ name: "video", maxCount: 1 },{ name: "thumbnail", maxCount: 1 },]),uploadVideo);

router.route('/open-video/:videoId').get(verifyJWT,openVideo);

router.route('/subscribe/:channelId').post(verifyJWT, toggleSubscription);

router.route('/clear-watch-history').delete(verifyJWT,clearWatchHistory);

router.route('/get-subcribers-count/:channelId').get(verifyJWT,getSubscriberCount);

router.route('/channel-videos/:channelId').get(verifyJWT,getChannelVideos);

router.route('/my-subscriptions').get(verifyJWT,getOwnSubscriptions);

router.route('/video-details/:videoId').get(verifyJWT,getVideoDetails)
export default router
