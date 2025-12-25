import express from 'express'
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { newComment, replytoComment, reactToComment, editComment } from "../controllers/comment.controller.js";

const router = express.Router();

router.route("/:videoId").post(verifyJWT, newComment);

router.route("/:commentId/reply").post(verifyJWT, replytoComment);

router.route("/:commentId/react").post(verifyJWT, reactToComment);

router.route("/:commentId/edit").patch(verifyJWT, editComment);

export default router;
