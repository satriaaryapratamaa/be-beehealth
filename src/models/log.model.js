import { MealType } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export const createFoodlog = (data) => {
    return prisma.foodlog.create({
        data: {
            userId: data.userId,
            foodId: data.foodId,
            MealType: data.MealType,
            porsi: data.porsi,
            date: data.date,
        },
        include: {
            food: true,
        },
    });
}