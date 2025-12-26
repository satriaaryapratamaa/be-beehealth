import * as UserModel from './user.model.js';
import * as LogModel from './log.model.js';
import { prisma } from '../lib/prisma.js'; 

export const getRequiredRecommendationData = async (userId, date) => {
    const userProfile = await UserModel.findUserById(userId);
    
    const logsData = await LogModel.getDailyLogs(userId, date);
    const allFoods = await prisma.food.findMany(); 
    const allExercises = await prisma.exercise.findMany();

    return {
        userProfile,
        dailyLogs: logsData, // Kita butuh foodLogs & exerciseLogs mentah
        allFoods,
        allExercises,
    };
};