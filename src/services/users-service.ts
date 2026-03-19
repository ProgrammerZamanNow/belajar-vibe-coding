import { db } from "../db";
import { users, sessions } from "../db/schema";
import { eq } from "drizzle-orm";

export class UsersService {
  static async login(email: string, pass: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      throw new Error("Email atau password salah");
    }

    const isPasswordValid = await Bun.password.verify(pass, user.password);
    if (!isPasswordValid) {
      throw new Error("Email atau password salah");
    }

    const token = crypto.randomUUID();
    await db.insert(sessions).values({
      token,
      userId: user.id,
    });

    return token;
  }

  static async getCurrentUser(token: string) {
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.token, token),
    });

    if (!session) {
      throw new Error("Unauthorized");
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.userId),
    });

    if (!user) {
      throw new Error("Unauthorized");
    }

    return user;
  }

  static async logoutUser(token: string) {
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.token, token),
    });

    if (!session) {
      throw new Error("Unauthorized");
    }

    await db.delete(sessions).where(eq(sessions.token, token));

    return "OK";
  }

  static async register(name: string, email: string, pass: string) {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      throw new Error("Email sudah terdaftar");
    }

    const hashedPassword = await Bun.password.hash(pass, {
      algorithm: "bcrypt",
      cost: 10,
    });

    await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
    });

    return "OK";
  }
}
