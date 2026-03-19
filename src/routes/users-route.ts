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
  .get("/current", async ({ headers, set }) => {
    try {
      const auth = headers["authorization"];
      if (!auth || !auth.startsWith("Bearer ")) {
        throw new Error("Unauthorized");
      }

      const token = auth.split(" ")[1] ?? "";
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
  });
