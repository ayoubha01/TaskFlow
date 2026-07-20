import { Router } from "express";
import {
  create,
  getOne,
  updateStatus,
  update,
  remove,
  comment,
} from "../controllers/tasks.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.post("/", create);
router.get("/:taskId", getOne);
router.patch("/:taskId/status", updateStatus);
router.patch("/:taskId", update);
router.delete("/:taskId", remove);
router.post("/:taskId/comments", comment);


export default router;