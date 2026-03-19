# Belajar Vibe Coding

A RESTful API application for User Management built with [Bun](https://bun.sh/) and [ElysiaJS](https://elysiajs.com/).

## Deskripsi Aplikasi (Application Description)

Aplikasi ini adalah backend service sederhana yang menyediakan fitur manajemen pengguna (User Management). Fitur utama yang tersedia meliputi registrasi pengguna baru, login untuk mendapatkan token otentikasi, mengambil data profil pengguna yang sedang login (current user), dan logout untuk menghapus sesi.

## Technology Stack

- **Runtime**: [Bun](https://bun.sh/) (v1.3+)
- **Framework**: [Elysia](https://elysiajs.com/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Database**: MySQL
- **Language**: TypeScript

## Library yang Digunakan

- `elysia`: Web framework yang sangat cepat untuk Bun.
- `drizzle-orm`: TypeScript ORM untuk query database.
- `mysql2`: MySQL driver untuk Node.js/Bun.
- `drizzle-kit`: CLI tool untuk Drizzle (digunakan untuk memanajemen schema database).

## Arsitektur dan Struktur File

Proyek ini menggunakan pendekatan arsitektur berlapis (layered architecture) untuk memisahkan antara routing, business logic, dan koneksi database.

```text
.
├── src/
│   ├── db/
│   │   ├── index.ts        # Konfigurasi koneksi database MySQL
│   │   └── schema.ts       # Definisi schema/tabel database (Drizzle format)
│   ├── routes/
│   │   └── users-route.ts  # Definisi endpoint API untuk fitur pengguna
│   ├── services/
│   │   └── users-service.ts# Business logic (Register, Login, Get Current, Logout)
│   └── index.ts            # Entry point aplikasi dan setup utama Elysia
├── tests/
│   └── users.test.ts       # Unit/Integration tests menggunakan test runner Bun
├── drizzle.config.ts       # Konfigurasi setup Drizzle ORM
├── package.json            # Daftar dependencies, NPM scripts, config
└── bun.lock                # Lockfile dependensi dari Bun
```

## Schema Database

Terdapat 2 tabel utama dalam sistem ini:

**1. Tabel `users`**
Menyimpan data otentikasi dan profil pengguna.
- `id`: `INT` (Primary Key, Auto Increment)
- `name`: `VARCHAR(255)` (Not Null)
- `email`: `VARCHAR(255)` (Not Null, Unique)
- `password`: `VARCHAR(255)` (Not Null)
- `createdAt`: `TIMESTAMP` (Default Current Timestamp)

**2. Tabel `sessions`**
Menyimpan token sesi pengguna yang sedang aktif (login).
- `id`: `INT` (Primary Key, Auto Increment)
- `token`: `VARCHAR(255)` (Not Null)
- `userId`: `INT` (Foreign Key mengarah ke `users.id`)
- `createdAt`: `TIMESTAMP` (Default Current Timestamp)

## API yang Tersedia

Base URL: `http://localhost:3000` (jika menggunakan default port)

| Endpoint | Method | Headers | Body | Deskripsi |
|---|---|---|---|---|
| `/api/users` | `POST` | - | `{ "name": "...", "email": "...", "password": "..." }` | Registrasi user baru |
| `/api/users/login` | `POST` | - | `{ "email": "...", "password": "..." }` | Login user, mengembalikan token string |
| `/api/users/current` | `GET` | `Authorization: Bearer <token>` | - | Mengambil data diri user (id, name, email) |
| `/api/users/logout` | `DELETE`| `Authorization: Bearer <token>` | - | Logout user (menghapus session database) |

## Cara Setup Project

1. Pastikan [Bun](https://bun.sh/) dan MySQL database server sudah terinstall di komputer Anda.
2. Clone repository proyek ini dan masuk ke dalam foldernya.
3. Install seluruh dependencies dengan perintah:
   ```bash
   bun install
   ```
4. Buat database MySQL baru, misalnya: `belajar_vibe_coding`.
5. Buat file `.env` di dalam root direktori proyek (jika belum ada), lalu isikan konfigurasi database berikut (sesuaikan dengan username dan password database lokal Anda):
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=belajar_vibe_coding
   ```
6. Sinkronisasi (push) schema database untuk membuat tabel ke dalam MySQL dengan menjalankan perintah:
   ```bash
   bunx drizzle-kit push
   ```

## Cara Run Aplikasi

Untuk menjalankan server dalam mode **development** (otomatis restart jika ada perubahan file):
```bash
bun run dev
```

Untuk menjalankan aplikasi standar (tanpa watch/reload file):
```bash
bun run src/index.ts
```
Jika tidak ada error, Anda akan melihat log `🦊 Elysia is running at localhost:3000`.

## Cara Test Aplikasi

Proyek ini telah dikonfigurasi menggunakan test runner bawaan dari Bun (`bun:test`). Seluruh pengujian disimpan di folder `tests/`.

Untuk mengeksekusi seluruh pengujian (integration testing API register, login, current, logout) jalankan perintah:
```bash
bun test
```
**Catatan:** Pastikan koneksi dan tabel database (via `.env` dan `drizzle-kit push`) sudah berhasil disetup sebelum menjalankan test, karena test akan melakukan proses baca/tulis terhadap database secara real.
