import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/db.js";
import { env } from "../config/env.js";

const TOKEN_EXPIRY = "7d";

export async function registerUser({ email, password, name }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error("Email already in use");
    err.status = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash, name },
  });

  return buildAuthResponse(user);
}

export async function loginUser({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }

  return buildAuthResponse(user);
}

function buildAuthResponse(user) {
  const token = jwt.sign({ sub: user.id, email: user.email }, env.jwtSecret, {
    expiresIn: TOKEN_EXPIRY,
  });

  return {
    token,
    user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
  };
}

export async function updateUser({ userId, name }) {
  return prisma.user.update({
    where: { id: userId },
    data: { name },
    select: { id: true, email: true, name: true, createdAt: true },
  });
}

export function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}