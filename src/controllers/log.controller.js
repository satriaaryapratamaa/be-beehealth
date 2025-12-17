import * as LogModel from '../models/log.model.js';
import { prisma } from '../lib/prisma.js';

export const logFood = async (req, res) => {
    const userId = req.user.userId;
    // const { foodId, mealType, porsi} = req.body;
    // const foodNama = parseFloat(req.body.foodNama);
    const { foodNama, mealType} = req.body;
    const porsi = parseFloat(req.body.porsi);
    // const foodNama = req.body.foodNama;
    // const porsi = parseFloat(req.body.porsi);
    // const  mealType  = req.body.mealType;

    if (!foodNama || !mealType || !porsi) {
        return res.status(400).json({ message: "FoodNama, mealType, dan porsi wajib diisi." });
    } 

    try {
        const foodData = await prisma.food.findUnique({
            where: { nama: foodNama }
        });
        if (!foodData) {
            return res.status(404).json({ message: `Makanan dengan ID ${foodNama} tidak ditemukan. `});
        }
        const log = await LogModel.createFoodlog({ userId,foodId: foodData.id, foodNama, mealType, porsi });

        // const caloriesIn = log.food.kalori * log.porsi;
        const caloriesIn = foodData.kalori * porsi;
        await LogModel.upsertDailySummary(userId, log.tanggal, caloriesIn, 0);

        res.status(200).json({ message: 'Log makanan berhasil ditambahkan', data: log });
        
    } catch (error) {
        res.status(500).json({ message: 'Gagal mencatat makanan', error: error.message });
    }
};

export const logExercise = async (req, res) => {
    const userId = req.user?.userId;
    const { exerciseId } = req.body;
    const durationInMinute = parseInt(req.body.durationInMinute);

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    if (!exerciseId || !durationInMinute) {
        return res.status(400).json({ message: "ExerciseId dan durationInMinute wajib diisi." });
    }

    try {
        const exerciseData = await prisma.exercise.findUnique({
            where: { id: exerciseId }
        });

        if (!exerciseData) {
            return res.status(404).json({ message: `Olahraga dengan ID ${exerciseId} tidak ditemukan.`});
        }

        const log = await LogModel.createExerciselog({ userId, exerciseId, durationInMinute });

        // const caloriesOut = log.exerciseId.kaloriTerbakarPerMenit * durationInMinute;
        const caloriesOut = exerciseData.caloriesBurnPerMinute * durationInMinute;
        await LogModel.upsertDailySummary(userId, log.tanggal, 0, caloriesOut);
    
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
