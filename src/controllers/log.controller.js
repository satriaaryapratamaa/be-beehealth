import * as LogModel from '../models/log.model.js';
import * as UserModel from '../models/user.model.js';
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
    
    let { exerciseId, namaKegiatan, durationInMinute } = req.body;
    
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    if ((!exerciseId && !namaKegiatan) || !durationInMinute) {
        return res.status(400).json({ message: "Nama Kegiatan/ID dan durasi wajib diisi." });
    }

    try {
        let exerciseData = null;

        // 1. Cari Data Olahraga
        if (exerciseId) {
            // Jika user kirim ID
            exerciseData = await prisma.exercise.findUnique({ where: { id: exerciseId } });
        } else if (namaKegiatan) {
            // Jika user kirim Nama (Contoh: "Basket")
            exerciseData = await prisma.exercise.findFirst({
                where: {
                    namaKegiatan: {
                        equals: namaKegiatan,
                        mode: 'insensitive' // Supaya "basket" terbaca sama dengan "Basket"
                    }
                }
            });
        }

        if (!exerciseData) {
            return res.status(404).json({ message: `Olahraga '${namaKegiatan || exerciseId}' tidak ditemukan.` });
        }

        const log = await LogModel.createExerciselog({ 
            userId, 
            exerciseId: exerciseData.id, // Pakai ID asli dari database
            durationInMinute: durationInMinute // Kirim durasi (tanpa s) ke model
        });

        const caloriesOut = exerciseData.caloriesBurnPerMinute * parseInt(durationInMinute);
        await LogModel.upsertDailySummary(userId, log.tanggal, 0, caloriesOut);
    
        res.status(200).json({ message: 'Log olahraga berhasil ditambahkan', data: log });

    } catch (error) {
        console.error(error); // Cek terminal backend jika error lagi
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

const calculateNewStreak = (currentStreak, lastLogDate, logDateInput) => {
    const today = new Date(logDateInput);
    today.setHours(0, 0, 0, 0);

    let lastLog = lastLogDate ? new Date(lastLogDate) : null;
    if (lastLog) lastLog.setHours(0, 0, 0, 0);

    if (!lastLog) return 1; 
    
    if (today.getTime() === lastLog.getTime()) return currentStreak;

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    if (lastLog.getTime() === yesterday.getTime()) {
        return currentStreak + 1; 
    } else {
        return 1;
    }
};