import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getVideoDetails,openVideo,reactToVideo,getChannelVideos, uploadVideo } from "../controllers/video.controller.js";
import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";

const router= Router();

router.route("/upload-video").post(verifyJWT,upload.fields([{ name: "video", maxCount: 1 },{ name: "thumbnail", maxCount: 1 },]),uploadVideo);

router.get("/:videoId", verifyJWT, getVideoDetails);

router.get("/:videoId/open", verifyJWT, openVideo);

router.post("/:videoId/react", verifyJWT, reactToVideo);

router.get("/channel/:channelId", getChannelVideos);



export default router;