import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getConversationMessages } from "../controllers/messages.controller.js";

const router = express.Router();

router.use(protectRoute);
router.get("/:id", getConversationMessages);

export default router;
