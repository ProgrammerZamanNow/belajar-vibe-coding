import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

export class UsersService {
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
