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
  });
