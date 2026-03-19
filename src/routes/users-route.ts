import { Elysia, t } from "elysia";
import { UsersService } from "../services/users-service";

export const usersRoute = new Elysia({ prefix: "/api/users" })
  .post("/", async ({ body, set }) => {
    try {
      await UsersService.register(body.name, body.email, body.password);
      return { data: "OK" };
    } catch (error: any) {
      set.status = 400;
      const message = error.message?.includes("Failed query") ? "Terjadi kesalahan" : error.message;
      return { error: message || "Terjadi kesalahan" };
    }
  }, {
    body: t.Object({
      name: t.String({ minLength: 3, maxLength: 255 }),
      email: t.String({ format: "email", maxLength: 255 }),
      password: t.String({ minLength: 6, maxLength: 255 }),
    })
  })
  .post("/login", async ({ body, set }) => {
    try {
      const token = await UsersService.login(body.email, body.password);
      return { data: token };
    } catch (error: any) {
      set.status = 401;
      const message = error.message?.includes("Failed query") ? "Email atau password salah" : error.message;
      return { error: message || "Email atau password salah" };
    }
  }, {
    body: t.Object({
      email: t.String({ format: "email", maxLength: 255 }),
      password: t.String({ maxLength: 255 }),
    })
  })
  .guard({
    beforeHandle: ({ headers, set }) => {
      const auth = headers["authorization"];
      if (!auth || !auth.startsWith("Bearer ")) {
        set.status = 401;
        return { error: "Unauthorized" };
      }
    }
  })
  .derive(({ headers }) => {
    const auth = headers["authorization"];
    if (!auth || !auth.startsWith("Bearer ")) {
      return { token: "" };
    }
    return { token: auth.split(" ")[1] ?? "" };
  })
  .get("/current", async ({ token, set }) => {
    try {
      const user = await UsersService.getCurrentUser(token);
      return {
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          created_at: user.createdAt,
        },
      };
    } catch (error: any) {
      set.status = 401;
      const message = error.message?.includes("Failed query") ? "Unauthorized" : error.message;
      return { error: message || "Unauthorized" };
    }
  })
  .delete("/logout", async ({ token, set }) => {
    try {
      await UsersService.logoutUser(token);
      return { data: "OK" };
    } catch (error: any) {
      set.status = 401;
      const message = error.message?.includes("Failed query") ? "Unauthorized" : error.message;
      return { error: message || "Unauthorized" };
    }
  });
