import { Router } from "express";
import { clearWatchHistory, getCurrentUser, getUserChannelProfie, getWatchHistory, updateAccountDetails, updateUserAvatar, updateUserCoverImage} from '../controllers/user.controller.js'
import {upload} from '../middlewares/multer.middleware.js'
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router=Router();

router.route('/current-user').get(verifyJWT,getCurrentUser);

router.route('/update-account').patch(verifyJWT,updateAccountDetails);

router.route('/avatar').patch(verifyJWT,upload.single("avatar"),updateUserAvatar);

router.route('/cover-image').patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage);

router.route("/c/:username").get(verifyJWT,getUserChannelProfie);

router.route('/history').get(verifyJWT, getWatchHistory);

router.route('/clear-watch-history').delete(verifyJWT,clearWatchHistory);

export default router
