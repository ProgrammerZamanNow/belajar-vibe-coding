import { db } from "../db";
import { users, sessions } from "../db/schema";
import { eq } from "drizzle-orm";

export class UsersService {
  /**
   * Mengautentikasi pengguna berdasarkan email dan password.
   * Jika berhasil, fungsi ini akan membuat sesi baru di database dan mengembalikan token otentikasi.
   *
   * @param email - Alamat email pengguna
   * @param pass - Kata sandi pengguna (plaintext yang akan diverifikasi dengan hash)
   * @returns {Promise<string>} Token sesi (UUID) jika otentikasi berhasil
   * @throws Error jika email tidak ditemukan atau password salah
   */
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

  /**
   * Mengambil data profil pengguna yang sedang login berdasarkan token sesi otentikasi.
   *
   * @param token - Token (UUID) sesi otentikasi milik pengguna
   * @returns Data pengguna dari database
   * @throws Error "Unauthorized" jika token tidak valid / sesi tidak ditemukan
   */
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

  /**
   * Mengakhiri sesi pengguna (logout) secara permanen dengan menghapus data sesi dari database.
   *
   * @param token - Token otentikasi sesi yang akan dihapus
   * @returns {Promise<string>} String "OK" jika logout berhasil
   * @throws Error "Unauthorized" jika token / sesi sudah tidak ada di database
   */
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

  /**
   * Mendaftarkan pengguna baru ke dalam database.
   * Fungsi ini akan memastikan email belum terdaftar dan melakukan hashing password secara aman sebelum disimpan.
   *
   * @param name - Nama pengguna
   * @param email - Alamat email yang akan didaftarkan (harus unik)
   * @param pass - Kata sandi pengguna dalam plaintext (akan di-hash)
   * @returns {Promise<string>} String "OK" jika pendaftaran berhasil
   * @throws Error jika email sudah pernah diregistrasi sebelumnya
   */
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
