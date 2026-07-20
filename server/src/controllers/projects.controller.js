
import { z } from "zod";
import {
  createProject,
  listProjectsForUser,
  getProjectForUser,
  addMember,
  addMemberByEmail,
} from "../services/projects.service.js";

const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
});

const inviteByEmailSchema = z.object({
  email: z.string().email(),
});

const addMemberSchema = z.object({
  userId: z.string().uuid(),
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