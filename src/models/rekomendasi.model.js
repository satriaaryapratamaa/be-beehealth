import * as UserModel from './user.model.js';
import * as LogModel from './log.model.js';
import * as FoodModel from './food.model.js';
import * as ExerciseModel from './exercise.model.js';

export const getRequiredRecommendationData = async (userId,date) => {

    const userProfile = await UserModel.getUserByID(userId);
    const { summary } = await LogModel.getDailyLogs(userId, date);

    const allFoods = await FoodModel.getAllFoods();
    const allExercises = await ExerciseModel.getAllExercises();

    return {
        userProfile,
        dailySummary : summary,
        allFoods,
        allExercises,
    };
}