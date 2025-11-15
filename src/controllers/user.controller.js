import * as UserModel from '../models/user.model.js';


function calculateBMR(gender, weight, height, age) {
    if (gender === 'MALE') {
        return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else if (gender === 'FEMALE') {
        return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }
    return 0;
}

function calculateTDEE(bmr) {
    const activityLevel = 1.375; 
    return bmr * activityLevel;
}


export const calculateCalorie = async (req, res) => {
    const userId = req.user.userId;
    const { gender, age, height, weight, goal } = req.body;

    if (!gender || !age || !height || !weight || !goal) {
        return res.status(400).json({ message: "Semua data (gender, age, height, weight, goal) wajib diisi." });
    }

    const ageNum = parseInt(age);
    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);

    if (isNaN(ageNum) || isNaN(heightNum) || isNaN(weightNum)) {
        return res.status(400).json({ message: "Age, height, dan weight harus berupa angka." });
    }

    try {
        const bmr = calculateBMR(gender, weightNum, heightNum, ageNum);
        const tdee = calculateTDEE(bmr);

        let targetCalories;
        if (goal === 'CUTTING') targetCalories = tdee - 500;
        else if (goal === 'BULKING') targetCalories = tdee + 500;
        else targetCalories = tdee;
    
        const targetProtein = 2 * weightNum;
        const targetFat = 1 * weightNum;
        const targetCarbs = (targetCalories - (targetProtein * 4) - (targetFat * 9)) / 4;

        const updateData = {
            gender,
            age: ageNum, // Kirim angka
            height: heightNum, // Kirim angka
            weight: weightNum, // Kirim angka
            goal,
            targetCalories, 
            targetProtein, 
            targetCarbs, 
            targetFat
        };
    // 3. Panggil Model
        const updatedUser = await UserModel.updateUserCalculations(userId, updateData);

    // 4. Kirim Respons
        res.status(200).json({
            message: "Kalkulasi kalori berhasil disimpan!",
            data: {
            targetCalories: updatedUser.targetCalories,
            targetProtein: updatedUser.targetProtein,
            targetCarbs: updatedUser.targetCarbs,
            targetFat: updatedUser.targetFat,
            }
        });

    } catch (error) {
        res.status(500).json({ message: "Terjadi kesalahan server.", error: error.message });
    }
};

export const getUserProfile = async (req, res) => {
    const userId = req.user.userId;

    try {
    // 1. Panggil Model
        const user = await UserModel.findUserById(userId);

        if (!user) {
        return res.status(404).json({ message: "User tidak ditemukan." });
        }
    
    // 2. Kirim Respons
        res.status(200).json({ data: user });
    } catch (error) {
        res.status(500).json({ message: "Terjadi kesalahan server.", error: error.message });
    }
};