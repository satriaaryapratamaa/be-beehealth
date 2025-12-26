import * as RekomendasiModel from '../models/rekomendasi.model.js'; 

export const getRekomendasi = async (req, res) => {
    const userId = req.user.userId;
    const today = new Date(); // Waktu server saat ini

    try {
        const data = await RekomendasiModel.getRequiredRecommendationData(userId, today);
        const { userProfile, dailyLogs, allFoods, allExercises } = data;

    if (!userProfile || !userProfile.targetCalories) {
        return res.status(200).json({
            summary: { status: "CALCULATE_REQUIRED" },
            macros: null,
            recommendations: { food: [], exercise: [] }
        });
    }

    const foodLogs = dailyLogs.foodLogs || [];
    const exerciseLogs = dailyLogs.exerciseLogs || [];

    let consumed = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    let burnedCalories = 0;

    foodLogs.forEach(log => {
        if(log.food) {
            const porsi = log.porsi || 1;
            consumed.calories += (log.food.kalori * porsi);
            consumed.protein += (log.food.protein * porsi);
            consumed.carbs += (log.food.carbs * porsi);
            consumed.fat += (log.food.fat * porsi);
        }
    });

    exerciseLogs.forEach(log => {
        if(log.exercise) {
            burnedCalories += (log.exercise.caloriesBurnPerMinute * log.durationInMinutes);
        }
    });

    // 4. Hitung Kalori Bersih & Sisa Kalori
    const currentNetCalories = consumed.calories - burnedCalories;
    const remainingCalories = userProfile.targetCalories - currentNetCalories;

    // 5. Siapkan Data Macro untuk Frontend (Progress Bar)
    const macros = {
        protein: {
            target: userProfile.targetProtein || 0,
            consumed: Math.round(consumed.protein),
            remaining: Math.round((userProfile.targetProtein || 0) - consumed.protein)
        },
        carbs: {
            target: userProfile.targetCarbs || 0,
            consumed: Math.round(consumed.carbs),
            remaining: Math.round((userProfile.targetCarbs || 0) - consumed.carbs)
        },
        fat: {
            target: userProfile.targetFat || 0,
            consumed: Math.round(consumed.fat),
            remaining: Math.round((userProfile.targetFat || 0) - consumed.fat)
        }
    };

    let status = "MAINTAINED";
    if (remainingCalories > 200) status = "NEEDS_FOOD";
    else if (remainingCalories < -200) status = "NEEDS_EXERCISE";

    let suggestedFoods = [];
    let suggestedExercises = [];

    if (status === "NEEDS_FOOD" || status === "MAINTAINED") {
        suggestedFoods = allFoods
            .sort(() => 0.5 - Math.random()) // Shuffle array
            .slice(0, 6); // Ambil 6 item pertama
    }

    if (status === "NEEDS_EXERCISE") {
        suggestedExercises = allExercises
            .sort(() => 0.5 - Math.random())
            .slice(0, 5);
    }

    res.json({
      summary: {
        status,
        target: Math.round(userProfile.targetCalories),
        consumed: Math.round(consumed.calories),
        burned: Math.round(burnedCalories),
        currentNet: Math.round(currentNetCalories),
        remaining: Math.round(remainingCalories) // Angka ini yang dipakai frontend
      },
      macros, // Data untuk progress bar Protein/Carbs/Fat
      recommendations: {
        food: suggestedFoods, // Array makanan rekomendasi
        exercise: suggestedExercises
      }
    });

  } catch (error) {
    console.error("Error Recommendation Controller:", error);
    res.status(500).json({ message: "Gagal memproses data rekomendasi." });
  }
};