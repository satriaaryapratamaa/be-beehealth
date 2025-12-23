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
            age: ageNum, 
            height: heightNum, 
            weight: weightNum, 
            goal,
            targetCalories, 
            targetProtein, 
            targetCarbs, 
            targetFat
        };

        const updatedUser = await UserModel.updateUserCalculations(userId, updateData);

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
        const user = await UserModel.findUserById(userId);

        if (!user) {
        return res.status(404).json({ message: "User tidak ditemukan." });
        }
    
        res.status(200).json({ data: user });
    } catch (error) {
        res.status(500).json({ message: "Terjadi kesalahan server.", error: error.message });
    }
};

// export const getUserStats = async (req, res) => {
//     const userId = req.user.userId;

//     try {
//         const user = await prisma.user.findUnique({
//             where: { id: userId },
//             select: { streak: true, lastLogDate: true, username: true } // Ambil yang perlu aja
//         });

//         const today = new Date().toISOString().split('T')[0];
//         const lastLog = user.lastLogDate ? user.lastLogDate.toISOString().split('T')[0] : null;
    
//         const isStreakActive = (lastLog === today);

//         res.json({
//             streak: user.streak,
//             isStreakActive: isStreakActive,
//             username: user.username
//         });
//     } catch (error) {
//     res.status(500).json({ message: "Error fetch stats" });
//     }
// };

export const getUserStats = async (req, res) => {
    
    try {
        let userId = null;
    
        if (req.params && req.params.id && req.params.id !== 'undefined' && req.params.id !== 'null') {
            userId = req.params.id;
        } else if ( req.user && req.user.userId) {
            userId = req.user.userId;
        }

        if (!userId) {
            return res.status(400).json({ message: "User ID tidak ditemukan." });
        }

        const user = await UserModel.findUserForStreak(userId);

        if (!user) {
            return res.status(404).json({ message: "User tidak ditemukan." });
        }

        let isStreakActive = false;

        if (user.lastLogDate) {
            // const today = new Date();
            // const lastLog = new Date(user.lastLogDate);

            // isStreakActive = today.getDay() === lastLog.getDay() && 
            // today.getMonth() === lastLog.getMonth() &&
            // today.getFullYear === lastLog.getFullYear();
            const serverDateWIB = new Date().toLocaleDateString('en-CA', {timeZone: 'Asia/Jakarta'});
            const lastLogDateWIB = new Date(user.lastLogDate).toLocaleDateString('en-CA', {timeZone
                : 'Asia/Jakarta'});

            isStreakActive = serverDateWIB === lastLogDateWIB;
        }
        const currentLoggedInId = req.user ? req.user.userId : null;
        const isMe = currentLoggedInId === userId;
        const finalActiveStatus = isMe ? isStreakActive : (user.streak > 0);

        res.status(200).json({
            streak: user.streak || 1,
            isStreakActive: finalActiveStatus,
            username: user.username,
        })
    } catch (error) {
        console.error("Error fetching user stats:", error);
        res.status(500).json({ message: "Gagal mengambil data streak.", error: error.message });
    }
}