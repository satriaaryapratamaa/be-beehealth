import * as LogModel from '../models/log.model.js';

export const LogFood = async (req, res) => {
    const userId = req.user.userId;
    const { foodId, mealType, porsi} = req.body;

    if (!foodId || !mealType || !porsi) {
        return res.status(400).json({ message: "FoodId, mealType, dan porsi wajib diisi." });
    } 

    try {
        const log = await LogModel.createFoodlog({
            userId: userId,
            foodId: foodId,
            mealType: mealType,
            porsi: porsi,
        });

        const caloriesIn = log.food.kalori * porsi;
        await LogModel.upsertDailySummary(userId, log.tanggal, caloriesIn, 0);

        res.status(200).json({ message: 'Log makanan berhasil ditambahkan', data: log });
        
    } catch (error) {
        res.status(500).json({ message: 'Gagal mencatat makanan', error: error.message });
    }
};

export const getDailyLogs = async (req, res) => {
    const userId = req.user.userId;
    const dateParam = req.query.date ? new Date(req.query.date) : new Date();

    try {
        const { foodLogs, exerciseLogs, summary : dailySummary } = await LogModel.getDailyLogs(userId, dateParam);

        res.status(200).json({ 
            data: dateParam.toISOString().split('T')[0],
            summary: summary,
            foodLogs,
            exerciseLogs,
    });
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil log harian', error: error.message });
    }
};