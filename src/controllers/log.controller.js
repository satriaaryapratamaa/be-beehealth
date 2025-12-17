import * as LogModel from '../models/log.model.js';

export const logFood = async (req, res) => {
    const userId = req.user.userId;
    const { foodId, mealType, porsi} = req.body;

    if (!foodId || !mealType || !porsi) {
        return res.status(400).json({ message: "FoodId, mealType, dan porsi wajib diisi." });
    } 

    try {
        const log = await LogModel.createFoodlog({ userId, foodId, mealType, porsi });

        const caloriesIn = log.food.kalori * log.porsi;
        await LogModel.upsertDailySummary(userId, log.tanggal, caloriesIn, 0);

        res.status(200).json({ message: 'Log makanan berhasil ditambahkan', data: log });
        
    } catch (error) {
        res.status(500).json({ message: 'Gagal mencatat makanan', error: error.message });
    }
};

export const logExercise = async (req, res) => {
    const userId = req.user.userId;
    const { exerciseId, durationInMinute } = req.body;

    if (!exerciseId || !durationInMinute) {
        return res.status(400).json({ message: "ExerciseId dan durationInMinute wajib diisi." });
    }

    try {
        const log = await LogModel.createExerciselog({ userId, exerciseId, durationInMinute });

        const caloriesOut = log.exercise.kaloriTerbakarPerMenit * durationInMinute;
        await LogModel.upsertDailySummary(log.userId, log.tanggal, 0, caloriesOut);
    
        res.status(200).json({ message: 'Log olahraga berhasil ditambahkan', data: log });
    } catch (error) {
        res.status(500).json({ message: 'Gagal mencatat olahraga', error: error.message });
    }
};

export const getDailyLogs = async (req, res) => {
    const userId = req.user.userId;
    const dateParam = req.query.date ? new Date(req.query.date) : new Date();

    try {
        const { foodLogs, exerciseLogs, summary : dailySummary } = await LogModel.getDailyLogs(userId, dateParam);

        res.status(200).json({ 
            data: dateParam.toISOString().split('T')[0],
            summary: dailySummary || { totalCaloriesIn: 0, totalCaloriesOut: 0, netCalories: 0 },
            foodLogs,
            exerciseLogs
    });
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil log harian', error: error.message });
    }
};
