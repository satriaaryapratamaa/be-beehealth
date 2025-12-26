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

const getJakartaDate = () => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
};

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

// export const getUserStats = async (req, res) => {
    
//     try {
//         let userId = null;
    
//         if (req.params && req.params.id && req.params.id !== 'undefined' && req.params.id !== 'null') {
//             userId = req.params.id;
//         } else if ( req.user && req.user.userId) {
//             userId = req.user.userId;
//         }

//         if (!userId) {
//             return res.status(400).json({ message: "User ID tidak ditemukan." });
//         }

//         const user = await UserModel.findUserForStreak(userId);

//         if (!user) {
//             return res.status(404).json({ message: "User tidak ditemukan." });
//         }

//         let isStreakActive = false;

//         if (user.lastLogDate) {
//             // const today = new Date();
//             // const lastLog = new Date(user.lastLogDate);

//             // isStreakActive = today.getDay() === lastLog.getDay() && 
//             // today.getMonth() === lastLog.getMonth() &&
//             // today.getFullYear === lastLog.getFullYear();
//             const serverDateWIB = new Date().toLocaleDateString('en-CA', {timeZone: 'Asia/Jakarta'});
//             const lastLogDateWIB = new Date(user.lastLogDate).toLocaleDateString('en-CA', {timeZone
//                 : 'Asia/Jakarta'});

//             isStreakActive = serverDateWIB === lastLogDateWIB;
//         }
//         const currentLoggedInId = req.user ? req.user.userId : null;
//         const isMe = currentLoggedInId === userId;
//         const finalActiveStatus = isMe ? isStreakActive : (user.streak > 0);

//         res.status(200).json({
//             streak: user.streak || 1,
//             isStreakActive: finalActiveStatus,
//             username: user.username,
//         })
//     } catch (error) {
//         console.error("Error fetching user stats:", error);
//         res.status(500).json({ message: "Gagal mengambil data streak.", error: error.message });
//     }
// }

export const getUserStats = async (req, res) => {
  try {
    // 1. TENTUKAN USER ID
    // Prioritas: Params (jika lihat profil orang) -> Token (jika lihat profil sendiri)
    let userId = null;

    if (req.params && req.params.id && req.params.id !== 'undefined' && req.params.id !== 'null') {
        userId = req.params.id;
    } else if (req.user && req.user.userId) {
        userId = req.user.userId;
    }

    if (!userId) {
        return res.status(400).json({ message: "User ID tidak ditemukan." });
    }

    // 2. AMBIL DATA USER
    // Menggunakan findUserById yang sudah kita update di Model (sudah select streak & lastLogDate)
    const user = await UserModel.findUserById(userId);

    if (!user) {
        return res.status(404).json({ message: "User tidak ditemukan." });
    }

    // 3. LOGIC CEK APAKAH STREAK AKTIF (HARI INI SUDAH LOG?)
    let isStreakActive = false;

    if (user.lastLogDate) {
        // Ambil tanggal hari ini (Server Time - WIB) format YYYY-MM-DD
        const serverDateWIB = new Date().toLocaleDateString('en-CA', {timeZone: 'Asia/Jakarta'});
        
        // Ambil tanggal log terakhir user (WIB) format YYYY-MM-DD
        const lastLogDateWIB = new Date(user.lastLogDate).toLocaleDateString('en-CA', {timeZone: 'Asia/Jakarta'});

        // Bandingkan string tanggalnya
        // Jika SAMA, berarti user sudah mencatat hari ini -> Api Menyala (Active)
        isStreakActive = serverDateWIB === lastLogDateWIB;
    }

    // 4. LOGIKA TAMPILAN (SENDIRI VS ORANG LAIN)
    const currentLoggedInId = req.user ? req.user.userId : null;
    const isMe = currentLoggedInId === userId;
    
    // Jika melihat profil sendiri: status aktif = apakah sudah log hari ini?
    // Jika melihat orang lain: status aktif = apakah streak mereka > 0? (Opsional, agar terlihat keren)
    const finalActiveStatus = isMe ? isStreakActive : (user.streak > 0);

    // 5. KIRIM RESPONSE
    res.status(200).json({
      // Gunakan '|| 0' untuk safety, tapi jika logic updateModel jalan, ini akan berisi angka asli DB
      streak: user.streak || 0,
      
      isStreakActive: finalActiveStatus,
      
      // Data tambahan untuk UI
      username: user.username,
      nama: user.nama,
      // targetCalories: user.targetCalories // Bisa dikirim jika Timeline butuh
    });

  } catch (error) {
    console.error("Error fetching user stats:", error);
    res.status(500).json({ message: "Gagal mengambil data streak.", error: error.message });
  }
};