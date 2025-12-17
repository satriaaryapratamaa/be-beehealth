import * as RekomendasiModel from '../models/rekomendasi.model.js';

const CALORIE_THRESHOLD = 200; 
const MAX_RECOMMENDATIONS = 3;
const DEFAULT_EXERCISE_DURATION = 30;

export const getRecommendation = async (req, res) => {
    // const userId = req.params.userId;
    const today = new Date();
    const userId = req.user?.userId;

    try {
        const { userProfile, dailySummary, allFoods, allExercises } = await RekomendasiModel.getRequiredRecommendationData(userId, today);

        if (!userProfile || !userProfile.targetCalorie) {
            return res.status(400).json({ message: 'Lengkapi kalkulasi kalori Anda (target, berat, tinggi, dll.) terlebih dahulu.' });
        }

        const totalCaloriesIn = dailySummary ? dailySummary.caloriesIn : 0;
        const totalCaloriesOut = dailySummary ? dailySummary.caloriesOut : 0;

        const netCalories = totalCaloriesIn - totalCaloriesOut;
        const remainingCalories = userProfile.targetCalorie - netCalories;

        let foodRecommendations = [];
        let exerciseRecommendations = [];
        let status = 'MAINTAINED';

        if (remainingCalories > CALORIE_THRESHOLD) {
            status = 'NEEDS_FOOD';
            foodRecommendations = allFoods
                .filter(food => food.calories <= calorieDeficit)
                .sort((a, b) => b.calories - a.calories)
                .slice(0, MAX_RECOMMENDATIONS);

        } else if (remainingCalories < -CALORIE_THRESHOLD) {
            status = 'NEEDS_EXERCISE';
            const excess = Math.abs(remainingCalories);

            exerciseRecommendations = allExercises
                .filter(ex => (ex.caloriesBurnPerMinute * DEFAULT_EXERCISE_DURATION) >= (excess * 0.5))
                .sort((a, b) => b.caloriesBurnPerMinute - a.caloriesBurnPerMinute)
                .slice(0, MAX_RECOMMENDATIONS);
        } else {
            status = 'MAINTAINED';
        }

        res.status(200).json({
            summary : {
                target: userProfile.targetCalorie,
                currentNet: netCalories,
                remaining: remainingCalories,
                status: status,
            },
            recommendations: {
                food: foodRecommendations,
                exercise: exerciseRecommendations,
            },
        });
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        res.status(500).json({ message: 'Terjadi kesalahan saat mengambil rekomendasi.' });
    }
};