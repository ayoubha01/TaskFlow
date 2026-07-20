import { z } from "zod";
import {
  createTask,
  updateTaskStatus,
  updateTask,
  deleteTask,
  addComment,
} from "../services/tasks.service.js";
import { getIO } from "../sockets/index.js";

const createTaskSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1).max(300),
  description: z.string().max(5000).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(["todo", "in_progress", "done"]),
  position: z.number().int().min(0),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(5000).optional(),
  assignedToId: z.string().uuid().nullable().optional(),
});

const commentSchema = z.object({
  body: z.string().min(1).max(2000),
});

export async function create(req, res, next) {
  try {
    const data = createTaskSchema.parse(req.body);
    const task = await createTask({ ...data, createdById: req.user.id });

    getIO().to(`project:${data.projectId}`).emit("task:created", task);
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(req, res, next) {
  try {
    const { status, position } = updateStatusSchema.parse(req.body);
    const task = await updateTaskStatus({
      taskId: req.params.taskId,
      status,
      position,
      userId: req.user.id,
    });

    getIO().to(`project:${task.projectId}`).emit("task:statusChanged", task);
    res.json(task);
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const updates = updateTaskSchema.parse(req.body);
    const task = await updateTask({
      taskId: req.params.taskId,
      userId: req.user.id,
      ...updates,
    });

    getIO().to(`project:${task.projectId}`).emit("task:updated", task);
    res.json(task);
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const { id, projectId } = await deleteTask({
      taskId: req.params.taskId,
      userId: req.user.id,
    });

    getIO().to(`project:${projectId}`).emit("task:deleted", { id });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function comment(req, res, next) {
  try {
    const { body } = commentSchema.parse(req.body);
    const newComment = await addComment({
      taskId: req.params.taskId,
      body,
      authorId: req.user.id,
    });

    res.status(201).json(newComment);
  } catch (err) {
    next(err);
  }
}