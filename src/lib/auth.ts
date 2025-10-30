import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

export async function getCurrentUser(req: Request) {
  try {
    const cookie = req.headers.get("cookie");
    const tokenMatch = cookie?.match(/session_token=([^;]+)/);
    const token = tokenMatch?.[1];

    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });

    return user;
  } catch (error) {
    return null;
  }
}