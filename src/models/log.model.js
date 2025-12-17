// import { mealType } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export const createFoodlog = (data) => {
    return prisma.foodLog.create({
        data: {
            userId: data.userId,
            foodId: data.foodId,
            mealType: data.mealType,
            porsi: parseFloat(data.porsi),
            tanggal: new Date(),
        },
        include: {
            food: true,
        },
    });
}

export const createExerciselog = (data) => {
    return prisma.exerciseLog.create({
        data: {
            userId: data.userId,
            exerciseId: data.exerciseId,
            durationInMinute: parseInt(data.durationInMinute),
            tanggal: new Date(),
        },
        include: {
            exercise: true,
        },
    });
}

export const upsertDailySummary = async (userId, date, caloriesIn, caloriesOut) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    return prisma.dailyLogSummary.upsert({
        where: {
            userId_date: { 
                userId: userId,
                date: startOfDay,
            },
        },
        update: {
            totalCaloriesIn: {increment: caloriesIn},
            totalCaloriesOut: {increment: caloriesOut},
        },
        create: {
            userId: userId,
            date: startOfDay,
            totalCaloriesIn: caloriesIn,
            totalCaloriesOut: caloriesOut,
        },
    });
}

export const getDailyLogs = async (userId, date) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const foodLogs = await prisma.foodLog.findMany({
        where: {
            userId, tanggal: {
                gte: startOfDay,
                lte: endOfDay
            }
        },
        include: { 
            food: true 
        },
    });

    const exerciseLogs = await prisma.exerciseLog.findMany({
        where: {
            userId, tanggal: {
                gte: startOfDay,
                lte: endOfDay
            }
        },
        include: { 
            exercise: true 
        },
    });

    const dailySummary = await prisma.dailyLogSummary.findUnique({
        where: {
            userId_date: {
                userId, date: startOfDay
            }
        },
    });

    return {
        foodLogs,
        exerciseLogs,
        summary : dailySummary,
    };
}
