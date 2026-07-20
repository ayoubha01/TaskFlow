import { prisma } from "../config/db.js";
import { assertIsMember } from "./projects.service.js";

const VALID_STATUSES = ["todo", "in_progress", "done"];

export async function createTask({ projectId, title, description, createdById }) {
  await assertIsMember(projectId, createdById);

  const maxPosition = await prisma.task.aggregate({
    where: { projectId, status: "todo" },
    _max: { position: true },
  });

  return prisma.task.create({
    data: {
      projectId,
      title,
      description,
      createdById,
      status: "todo",
      position: (maxPosition._max.position ?? -1) + 1,
    },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function updateTaskStatus({ taskId, status, position, userId }) {
  if (!VALID_STATUSES.includes(status)) {
    const err = new Error(`Invalid status: ${status}`);
    err.status = 400;
    throw err;
  }

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    const err = new Error("Task not found");
    err.status = 404;
    throw err;
  }

  await assertIsMember(task.projectId, userId);

  return prisma.task.update({
    where: { id: taskId },
    data: { status, position },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function updateTask({ taskId, userId, ...updates }) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    const err = new Error("Task not found");
    err.status = 404;
    throw err;
  }
  await assertIsMember(task.projectId, userId);

  const allowed = ["title", "description", "assignedToId"];
  const data = Object.fromEntries(
    Object.entries(updates).filter(([key]) => allowed.includes(key))
  );

  return prisma.task.update({
    where: { id: taskId },
    data,
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function deleteTask({ taskId, userId }) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    const err = new Error("Task not found");
    err.status = 404;
    throw err;
  }
  await assertIsMember(task.projectId, userId);

  await prisma.task.delete({ where: { id: taskId } });
  return { id: taskId, projectId: task.projectId };
}

export async function addComment({ taskId, body, authorId }) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    const err = new Error("Task not found");
    err.status = 404;
    throw err;
  }
  await assertIsMember(task.projectId, authorId);

  return prisma.comment.create({
    data: { taskId, body, authorId },
    include: { author: { select: { id: true, name: true, email: true } } },
  });
}