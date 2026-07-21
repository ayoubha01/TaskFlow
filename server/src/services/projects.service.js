import { prisma } from "../config/db.js";

export async function createProject({ name, ownerId }) {
  return prisma.project.create({
    data: {
      name,
      members: {
        create: { userId: ownerId, role: "owner" },
      },
    },
    include: { members: true },
  });
}

export async function listProjectsForUser(userId) {
  return prisma.project.findMany({
    where: { members: { some: { userId } } },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
      _count: { select: { tasks: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProjectForUser(projectId, userId) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, members: { some: { userId } } },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
      tasks: {
        orderBy: { position: "asc" },
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          _count: { select: { comments: true, attachments: true } },
        },
      },
    },
  });

  if (!project) {
    const err = new Error("Project not found or access denied");
    err.status = 404;
    throw err;
  }

  return project;
}

export async function addMember({ projectId, userId, requesterId }) {
  await assertIsOwner(projectId, requesterId);

  return prisma.projectMember.create({
    data: { projectId, userId, role: "member" },
  });
}

export async function addMemberByEmail({ projectId, email, requesterId }) {
  await assertIsOwner(projectId, requesterId);

  const invitee = await prisma.user.findUnique({ where: { email } });
  if (!invitee) {
    const err = new Error(`No user found with email ${email}`);
    err.status = 404;
    throw err;
  }

  const existing = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: invitee.id, projectId } },
  });
  if (existing) {
    const err = new Error(`${email} is already a member of this project`);
    err.status = 409;
    throw err;
  }

  return prisma.projectMember.create({
    data: { projectId, userId: invitee.id, role: "member" },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
}

export async function deleteProject({ projectId, requesterId }) {
  await assertIsOwner(projectId, requesterId);
  await prisma.project.delete({ where: { id: projectId } });
  return { id: projectId };
}

export async function assertIsMember(projectId, userId) {
  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });
  if (!membership) {
    const err = new Error("Not a member of this project");
    err.status = 403;
    throw err;
  }
  return membership;
}

export async function assertIsOwner(projectId, userId) {
  const membership = await assertIsMember(projectId, userId);
  if (membership.role !== "owner") {
    const err = new Error("Only the project owner can perform this action");
    err.status = 403;
    throw err;
  }
  return membership;
}