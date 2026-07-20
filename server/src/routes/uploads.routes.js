import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth.middleware.js";
import { storeAttachment, getAttachmentUrl } from "../services/storage.service.js";
import { prisma } from "../config/db.js";
import { assertIsMember } from "../services/projects.service.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

router.use(requireAuth);

router.post("/:taskId", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const task = await prisma.task.findUnique({ where: { id: req.params.taskId } });
    if (!task) return res.status(404).json({ error: "Task not found" });
    await assertIsMember(task.projectId, req.user.id);

    const attachment = await storeAttachment({
      taskId: task.id,
      fileName: req.file.originalname,
      buffer: req.file.buffer,
    });

    res.status(201).json(attachment);
  } catch (err) {
    next(err);
  }
});

router.get("/:attachmentId/url", async (req, res, next) => {
  try {
    const attachment = await prisma.attachment.findUnique({
      where: { id: req.params.attachmentId },
      include: { task: true },
    });
    if (!attachment) return res.status(404).json({ error: "Attachment not found" });
    await assertIsMember(attachment.task.projectId, req.user.id);

    const url = await getAttachmentUrl(attachment);
    res.json({ url });
  } catch (err) {
    next(err);
  }
});

export default router;