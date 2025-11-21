import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcryptjs';

export const findUserByUsername = (username) => {
  return prisma.user.findUnique({
    where: { username },
  });
};

  export const findUserByEmail = (email) => {
  return prisma.user.findUnique({
    where: { email },
  });
};

export const findUserByEmailandUsername = (email, username) => {
  return prisma.user.findFirst({
    where: { AND: [{ email }, { username }] },
  });
};
export const findUserByEmailOrUsername = (email, username) => {
  return prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
};

export const createUser = async (data) => {
  // Pindahkan hashing password ke dalam model
  const hashedPassword = await bcrypt.hash(data.password, 12);

  return prisma.user.create({
    data: {
      email: data.email,
      username: data.username,
      nama: data.nama,
      password: hashedPassword,
      beratBadan: data.beratBadan,
      tinggiBadan: data.tinggiBadan,
      role: data.role || 'PENGGUNA_UMUM',
    },
  });
};

// --- Fungsi untuk Profil User ---
export const findUserById = (id) => {
  return prisma.user.findUnique({
    where: { id: id },
    select: {
      id: true,
      email: true,
      username: true,
      nama: true,
      role: true,
      gender: true,
      age: true,
      height: true,
      weight: true,
      targetCalories: true,
      targetProtein: true,
      targetCarbs: true,
      targetFat: true,
    },
  });
};

export const updateUserCalculations = (id, data) => {
  return prisma.user.update({
    where: { id: id },
    data: {
      gender: data.gender,
      age: parseInt(data.age),
      height: parseFloat(data.height),
      weight: parseFloat(data.weight),
      targetCalories: data.targetCalories,
      targetProtein: data.targetProtein,
      targetCarbs: data.targetCarbs,
      targetFat: data.targetFat,
    },
  });
};