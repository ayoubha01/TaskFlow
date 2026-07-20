import { Router } from "express";
import {
  create,
  list,
  getOne,
  addProjectMember,
} from "../controllers/projects.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.post("/", create);
router.get("/", list);
router.get("/:projectId", getOne);
router.post("/:projectId/members", addProjectMember);

export default router;