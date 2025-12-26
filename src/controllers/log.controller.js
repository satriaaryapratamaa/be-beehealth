import * as LogModel from '../models/log.model.js';
import * as UserModel from '../models/user.model.js';
import { prisma } from '../lib/prisma.js';

const getJakartaDateString = (dateInput) => {
    const d = dateInput ? new Date(dateInput) : new Date();
    return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
};

export const logFood = async (req, res) => {
    const userId = req.user.userId;
    const { foodNama, mealType, tanggal } = req.body;
    const porsi = parseFloat(req.body.porsi);

    // 1. Validasi Input
    if (!foodNama || !mealType || !porsi) {
        return res.status(400).json({ message: "FoodNama, mealType, dan porsi wajib diisi." });
    } 

    try {
        // 2. Cari Data Makanan
        const foodData = await prisma.food.findUnique({
            where: { nama: foodNama }
        });
        
        if (!foodData) {
            return res.status(404).json({ message: `Makanan '${foodNama}' tidak ditemukan.`});
        }

        // 3. Tentukan Tanggal Log
        const logDate = tanggal ? new Date(tanggal) : new Date();

        // 4. Simpan Log Makanan
        const log = await LogModel.createFoodlog({ 
            userId,
            foodId: foodData.id, 
            foodNama, 
            mealType, 
            porsi, 
            tanggal: logDate 
        });

        // 5. Update Daily Summary (Kalori Masuk)
        const caloriesIn = foodData.kalori * porsi;
        await LogModel.upsertDailySummary(userId, log.tanggal, caloriesIn, 0);

        // =========================================================
        // 6. UPDATE STREAK USER (PENTING!)
        // =========================================================
        console.log(`[LOG] Mengupdate streak untuk user ${userId}...`);
        await UserModel.updateUserStreak(userId, logDate);
        // =========================================================

        res.status(200).json({ message: 'Log makanan berhasil ditambahkan', data: log });
        
    } catch (error) {
        console.error("Error Log Food:", error);
        res.status(500).json({ message: 'Gagal mencatat makanan', error: error.message });
    }
};

// --- LOG EXERCISE ---
export const logExercise = async (req, res) => {
    const userId = req.user?.userId;
    let { exerciseId, namaKegiatan, durationInMinute, tanggal } = req.body;
    
    // 1. Validasi Input
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    if ((!exerciseId && !namaKegiatan) || !durationInMinute) {
        return res.status(400).json({ message: "Nama Kegiatan/ID dan durasi wajib diisi." });
    }

    try {
        // 2. Cari Data Olahraga (Bisa via ID atau Nama)
        let exerciseData = null;

        if (exerciseId) {
            exerciseData = await prisma.exercise.findUnique({ where: { id: exerciseId } });
        } else if (namaKegiatan) {
            exerciseData = await prisma.exercise.findFirst({
                where: {
                    namaKegiatan: {
                        equals: namaKegiatan,
                        mode: 'insensitive' // Case insensitive (Lari = lari)
                    }
                }
            });
        }

        if (!exerciseData) {
            return res.status(404).json({ message: `Olahraga '${namaKegiatan || exerciseId}' tidak ditemukan.` });
        }

        // 3. Tentukan Tanggal Log
        const logDate = tanggal ? new Date(tanggal) : new Date();

        // 4. Simpan Log Olahraga
        const log = await LogModel.createExerciselog({ 
            userId, 
            exerciseId: exerciseData.id, 
            durationInMinute: durationInMinute,
            tanggal: logDate 
        });

        // 5. Update Daily Summary (Kalori Keluar)
        const caloriesOut = exerciseData.caloriesBurnPerMinute * parseInt(durationInMinute);
        await LogModel.upsertDailySummary(userId, logDate, 0, caloriesOut);

        // =========================================================
        // 6. UPDATE STREAK USER (PENTING!)
        // =========================================================
        console.log(`[LOG] Mengupdate streak untuk user ${userId}...`);
        await UserModel.updateUserStreak(userId, logDate);
        // =========================================================
    
        res.status(200).json({ message: 'Log olahraga berhasil ditambahkan', data: log });

    } catch (error) {
        console.error("Error Log Exercise:", error); 
        res.status(500).json({ message: 'Gagal mencatat olahraga', error: error.message });
    }
};

export const getDailyLogs = async (req, res) => {
    const userId = req.user.userId;
    const dateParam = req.query.date ? new Date(req.query.date) : new Date();

    try {
        const { foodLogs, exerciseLogs, summary : dailySummary } = await LogModel.getDailyLogs(userId, dateParam);
        const dateResponse = getJakartaDateString(dateParam); 

        res.status(200).json({ 
            data: dateResponse, 
            summary: dailySummary || { totalCaloriesIn: 0, totalCaloriesOut: 0, netCalories: 0 },
            foodLogs,
            exerciseLogs
        });
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil log harian', error: error.message });
    }
};

// const calculateNewStreak = (currentStreak, lastLogDate, todayDateInput) => {
//     const todayStr = getJakartaDateString(todayDateInput);
//     const lastLogStr = lastLogDate ? getJakartaDateString(lastLogDate) : null;

//     if (!lastLogStr) return 1;
//     if (todayStr === lastLogStr) return currentStreak;

//     const todayDateObj = new Date(todayStr);
//     const lastLogDateObj = new Date(lastLogStr);
    
//     const diffTime = Math.abs(todayDateObj - lastLogDateObj);
//     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

//     if (diffDays === 1) {
//         return currentStreak + 1;
//     } else {
//         return 1;
//     }
// };

export const deleteFoodLog = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
        const checkLog = await prisma.foodLog.findUnique({
            where: { id: id }
        });

        if (!checkLog || checkLog.userId !== userId) {
            return res.status(404).json({ message: "Log tidak ditemukan atau bukan milik Anda." });
        }

        const deletedLog = await LogModel.deleteFoodLogById(id);

        const caloriesToSubtract = deletedLog.food.kalori * deletedLog.porsi;

        await LogModel.upsertDailySummary(userId, deletedLog.tanggal, -caloriesToSubtract, 0);

        res.status(200).json({ message: "Berhasil menghapus makanan" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Gagal menghapus log", error: error.message });
    }
};

export const deleteExerciseLog = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
        const checkLog = await prisma.exerciseLog.findUnique({
            where: { id: id }
        });

        if (!checkLog || checkLog.userId !== userId) {
            return res.status(404).json({ message: "Log tidak ditemukan." });
        }

        const deletedLog = await LogModel.deleteExerciseLogById(id);

        const caloriesToSubtract = deletedLog.exercise.caloriesBurnPerMinute * deletedLog.durationInMinutes;

        await LogModel.upsertDailySummary(userId, deletedLog.tanggal, 0, -caloriesToSubtract);

        res.status(200).json({ message: "Berhasil menghapus olahraga" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Gagal menghapus log", error: error.message });
    }
};

