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
      streak: true,       
      lastLogDate: true   
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

export const saveResetToken = (email, token, expiry) => {
  return prisma.user.update({
    where: { email: email },
    data: {
      resetToken: token,
      resetTokenExpiry: expiry,
    },
  });
};

export const findUserByValidToken = (token) => {
  return prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: {
        gt: new Date(), 
      },
    },
  });
};

export const updatePasswordReset = (userId, hashedPassword) => {
  return prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
      resetToken: null,      
      resetTokenExpiry: null, 
    },
  });
};

export const updateUserStreak = async (userId, logDateInput) => {
    const inputDate = new Date(logDateInput);
    inputDate.setHours(0, 0, 0, 0);

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { streak: true, lastLogDate: true }
    });

    if (!user) return;

    let newStreak = user.streak;
    let shouldUpdate = false;
    let newLastLogDate = inputDate;

    // 3. LOGIC UTAMA
    if (user.lastLogDate) {
        const lastLog = new Date(user.lastLogDate);
        lastLog.setHours(0, 0, 0, 0);

        if (inputDate.getTime() <= lastLog.getTime()) {
            return; 
        }

        const diffTime = Math.abs(inputDate - lastLog);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            newStreak += 1;
            shouldUpdate = true;
        } else {
            newStreak = 1;
            shouldUpdate = true;
        }

    } else {
        newStreak = 1;
        shouldUpdate = true;
    }

    if (shouldUpdate) {
        await prisma.user.update({
            where: { id: userId },
            data: {
                streak: newStreak,
                lastLogDate: inputDate 
            }
        });
    }
};