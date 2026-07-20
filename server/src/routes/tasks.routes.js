import { Router } from "express";
import {
  create,
  updateStatus,
  update,
  remove,
  comment,
} from "../controllers/tasks.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.post("/", create);
router.patch("/:taskId/status", updateStatus);
router.patch("/:taskId", update);
router.delete("/:taskId", remove);
router.post("/:taskId/comments", comment);

export default router;