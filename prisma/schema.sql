-- 1. Buat ENUM Types terlebih dahulu
CREATE TYPE "Role" AS ENUM ('PENGGUNA_UMUM', 'AHLI_GIZI', 'ADMIN');
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');
CREATE TYPE "MealType" AS ENUM ('SARAPAN', 'MAKAN_SIANG', 'MAKAN_MALAM', 'KUDAPAN');

-- 2. Tabel User
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PENGGUNA_UMUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),
    "streak" INTEGER NOT NULL DEFAULT 0,
    "lastLogDate" TIMESTAMP(3),
    "gender" "Gender",
    "age" INTEGER,
    "height" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "targetCalories" DOUBLE PRECISION,
    "targetProtein" DOUBLE PRECISION,
    "targetCarbs" DOUBLE PRECISION,
    "targetFat" DOUBLE PRECISION,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Index Unik untuk User
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_resetToken_key" ON "User"("resetToken");

-- 3. Tabel Food
CREATE TABLE "Food" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kalori" DOUBLE PRECISION NOT NULL,
    "protein" DOUBLE PRECISION NOT NULL,
    "carbs" DOUBLE PRECISION NOT NULL,
    "fat" DOUBLE PRECISION NOT NULL,
    "image" TEXT,

    CONSTRAINT "Food_pkey" PRIMARY KEY ("id")
);

-- Index Unik untuk Food
CREATE UNIQUE INDEX "Food_nama_key" ON "Food"("nama");

-- 4. Tabel Exercise
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "namaKegiatan" TEXT NOT NULL,
    "caloriesBurnPerMinute" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- Index Unik untuk Exercise
CREATE UNIQUE INDEX "Exercise_namaKegiatan_key" ON "Exercise"("namaKegiatan");

-- 5. Tabel FoodLog
CREATE TABLE "FoodLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "tanggal" DATE NOT NULL,
    "porsi" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "mealType" "MealType" NOT NULL,

    CONSTRAINT "FoodLog_pkey" PRIMARY KEY ("id")
);

-- Index untuk FoodLog
CREATE INDEX "FoodLog_userId_tanggal_idx" ON "FoodLog"("userId", "tanggal");

-- 6. Tabel ExerciseLog
CREATE TABLE "ExerciseLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "tanggal" DATE NOT NULL,
    "durationInMinutes" INTEGER NOT NULL,

    CONSTRAINT "ExerciseLog_pkey" PRIMARY KEY ("id")
);

-- Index untuk ExerciseLog
CREATE INDEX "ExerciseLog_userId_tanggal_idx" ON "ExerciseLog"("userId", "tanggal");

-- 7. Tabel Post
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "imageUrl" TEXT,
    "sharedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- Index untuk Post
CREATE INDEX "Post_userId_idx" ON "Post"("userId");

-- 8. Tabel Like
CREATE TABLE "Like" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,

    CONSTRAINT "Like_pkey" PRIMARY KEY ("id")
);

-- Index Unik untuk Like (User hanya bisa like 1x per post)
CREATE UNIQUE INDEX "Like_userId_postId_key" ON "Like"("userId", "postId");

-- 9. Tabel Comment
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- Index untuk Comment
CREATE INDEX "Comment_postId_idx" ON "Comment"("postId");

-- 10. Tabel DailyLogSummary
CREATE TABLE "DailyLogSummary" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "totalCaloriesIn" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCaloriesOut" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "DailyLogSummary_pkey" PRIMARY KEY ("id")
);

-- Index Unik untuk Summary (1 summary per user per hari)
CREATE UNIQUE INDEX "DailyLogSummary_userId_date_key" ON "DailyLogSummary"("userId", "date");

-- =============================================
-- DEFINISI FOREIGN KEY (RELASI ANTAR TABEL)
-- =============================================

-- Relasi FoodLog
ALTER TABLE "FoodLog" ADD CONSTRAINT "FoodLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FoodLog" ADD CONSTRAINT "FoodLog_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Relasi ExerciseLog
ALTER TABLE "ExerciseLog" ADD CONSTRAINT "ExerciseLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExerciseLog" ADD CONSTRAINT "ExerciseLog_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Relasi Post
ALTER TABLE "Post" ADD CONSTRAINT "Post_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Relasi Like
ALTER TABLE "Like" ADD CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Like" ADD CONSTRAINT "Like_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Relasi Comment
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Relasi DailyLogSummary
ALTER TABLE "DailyLogSummary" ADD CONSTRAINT "DailyLogSummary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;