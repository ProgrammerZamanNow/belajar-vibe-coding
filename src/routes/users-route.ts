import { Elysia, t } from "elysia";
import { UsersService } from "../services/users-service";

export const usersRoute = new Elysia({ prefix: "/api/users" })
  .post("/", async ({ body, set }) => {
    try {
      await UsersService.register(body.name, body.email, body.password);
      return { data: "OK" };
    } catch (error: any) {
      set.status = 400;
      return { error: error.message || "Terjadi kesalahan" };
    }
  }, {
    body: t.Object({
      name: t.String(),
      email: t.String({ format: "email" }),
      password: t.String(),
    })
  })
  .post("/login", async ({ body, set }) => {
    try {
      const token = await UsersService.login(body.email, body.password);
      return { data: token };
    } catch (error: any) {
      set.status = 401;
      return { error: error.message || "Email atau password salah" };
    }
  }, {
    body: t.Object({
      email: t.String({ format: "email" }),
      password: t.String(),
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
      return { error: error.message || "Unauthorized" };
    }
  })
  .delete("/logout", async ({ token, set }) => {
    try {
      await UsersService.logoutUser(token);
      return { data: "OK" };
    } catch (error: any) {
      set.status = 401;
      return { error: error.message || "Unauthorized" };
    }
  });
