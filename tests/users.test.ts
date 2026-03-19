import { describe, expect, it, beforeEach } from "bun:test";
import { app } from "../src/index";
import { db } from "../src/db";
import { users, sessions } from "../src/db/schema";
import { sql } from "drizzle-orm";

describe("User API Tests", () => {
  beforeEach(async () => {
    // Clear database before each test
    await db.delete(sessions);
    await db.delete(users);
  });

  describe("POST /api/users (Register)", () => {
    it("should register a new user successfully", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Eko",
            email: "eko@gmail.com",
            password: "rahasia",
          }),
        })
      );

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.data).toBe("OK");
    });

    it("should fail validation if fields are missing", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Eko",
          }),
        })
      );

      expect(response.status).toBe(422);
    });

    it("should fail if name is too long (> 255)", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "a".repeat(256),
            email: "long@gmail.com",
            password: "password123",
          }),
        })
      );

      expect(response.status).toBe(422);
    });

    it("should fail if email is already registered", async () => {
      // Register first user
      await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Eko",
            email: "eko@gmail.com",
            password: "rahasia",
          }),
        })
      );

      // Try register again with same email
      const response = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Eko 2",
            email: "eko@gmail.com",
            password: "rahasia",
          }),
        })
      );

      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.error).toBe("Email sudah terdaftar");
    });
  });

  describe("POST /api/users/login (Login)", () => {
    beforeEach(async () => {
      // Create a user for login tests
      await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Eko",
            email: "eko@gmail.com",
            password: "rahasia",
          }),
        })
      );
    });

    it("should login successfully with correct credentials", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "eko@gmail.com",
            password: "rahasia",
          }),
        })
      );

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.data).toBeDefined(); // token
    });

    it("should fail login with wrong password", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "eko@gmail.com",
            password: "salah",
          }),
        })
      );

      expect(response.status).toBe(401);
      const result = await response.json();
      expect(result.error).toBe("Email atau password salah");
    });
  });

  describe("GET /api/users/current (Current User)", () => {
    let token: string;

    beforeEach(async () => {
      // Register and login to get token
      await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Eko",
            email: "eko@gmail.com",
            password: "rahasia",
          }),
        })
      );

      const loginRes = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "eko@gmail.com",
            password: "rahasia",
          }),
        })
      );
      const loginData = await loginRes.json();
      token = loginData.data;
    });

    it("should get current user with valid token", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.data.email).toBe("eko@gmail.com");
      expect(result.data.name).toBe("Eko");
    });

    it("should fail with invalid token", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
          headers: {
            Authorization: `Bearer invalid-token`,
          },
        })
      );

      expect(response.status).toBe(401);
    });

    it("should fail if Authorization header is missing", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
        })
      );

      expect(response.status).toBe(401);
    });
  });

  describe("DELETE /api/users/logout (Logout)", () => {
    let token: string;

    beforeEach(async () => {
      // Register and login
      await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Eko",
            email: "eko@gmail.com",
            password: "rahasia",
          }),
        })
      );

      const loginRes = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "eko@gmail.com",
            password: "rahasia",
          }),
        })
      );
      const loginData = await loginRes.json();
      token = loginData.data;
    });

    it("should logout successfully", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/logout", {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.data).toBe("OK");

      // Verify session is deleted by trying to access current user
      const currentRes = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );
      expect(currentRes.status).toBe(401);
    });
  });
});
