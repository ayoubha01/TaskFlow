import { z } from "zod";
import {
  createProject,
  listProjectsForUser,
  getProjectForUser,
  addMember,
  addMemberByEmail,
  deleteProject,
} from "../services/projects.service.js";
import { getIO } from "../sockets/index.js";

const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
});

const addMemberSchema = z.object({
  userId: z.string().uuid(),
});

const inviteByEmailSchema = z.object({
  email: z.string().email(),
});

export async function create(req, res, next) {
  try {
    const { name } = createProjectSchema.parse(req.body);
    const project = await createProject({ name, ownerId: req.user.id });
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
}

export async function list(req, res, next) {
  try {
    const projects = await listProjectsForUser(req.user.id);
    res.json(projects);
  } catch (err) {
    next(err);
  }
}

export async function getOne(req, res, next) {
  try {
    const project = await getProjectForUser(req.params.projectId, req.user.id);
    res.json(project);
  } catch (err) {
    next(err);
  }
}

export async function addProjectMember(req, res, next) {
  try {
    const { userId } = addMemberSchema.parse(req.body);
    const membership = await addMember({
      projectId: req.params.projectId,
      userId,
      requesterId: req.user.id,
    });
    res.status(201).json(membership);
  } catch (err) {
    next(err);
  }
}

export async function inviteMember(req, res, next) {
  try {
    const { email } = inviteByEmailSchema.parse(req.body);
    const membership = await addMemberByEmail({
      projectId: req.params.projectId,
      email,
      requesterId: req.user.id,
    });
    res.status(201).json(membership);
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const { id } = await deleteProject({
      projectId: req.params.projectId,
      requesterId: req.user.id,
    });

    // Notify anyone currently viewing this project's board so they get
    // redirected instead of being left on a page for a project that no
    // longer exists.
    getIO().to(`project:${id}`).emit("project:deleted", { id });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}