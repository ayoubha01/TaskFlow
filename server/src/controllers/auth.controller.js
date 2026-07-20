import { z } from "zod";
import { registerUser, loginUser } from "../services/auth.service.js";
import { prisma } from "../config/db.js";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function register(req, res, next) {
  try {
    const data = registerSchema.parse(req.body);
    const result = await registerUser(data);
    res.status(201).json(result);
  } catch (err) {
    next(toHttpError(err));
  }
}

export async function login(req, res, next) {
  try {
    const data = loginSchema.parse(req.body);
    const result = await loginUser(data);
    res.json(result);
  } catch (err) {
    next(toHttpError(err));
  }
}

export async function me(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true, createdAt: true },
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
}

function toHttpError(err) {
  if (err.name === "ZodError") {
    const httpErr = new Error(err.errors.map((e) => e.message).join(", "));
    httpErr.status = 400;
    return httpErr;
  }
  return err;
}