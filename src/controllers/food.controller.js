import * as FoodModel from '../models/food.model.js';

// C = Create
export const createFood = async (req, res) => {
    const { nama, kalori, protein, carbs, fat } = req.body;
    if (!nama || !kalori || !protein || !carbs || !fat) {
        return res.status(400).json({ message: 'Semua field wajib diisi.' });
    }

    try {
    const newFood = await FoodModel.create(req.body);
    res.status(201).json({ message: 'Data makanan berhasil ditambahkan', data: newFood });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ message: 'Nama makanan sudah ada.' });
        }
    res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// R = Read (All)
export const getAllFood = async (req, res) => {
    const { search } = req.query; 

    try {
    const foods = await FoodModel.findAll(search);
    res.status(200).json({ data: foods });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


export const getFoodById = async (req, res) => {
    const { id } = req.params;

    try {
        const food = await FoodModel.findById(id);
        if (!food) {
            return res.status(404).json({ message: 'Makanan tidak ditemukan.' });
        }
    res.status(200).json({ data: food });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// U = Update
export const updateFood = async (req, res) => {
    const { id } = req.params;

    try {
        const updatedFood = await FoodModel.update(id, req.body);
        res.status(200).json({ message: 'Data makanan berhasil diupdate', data: updatedFood });
    } catch (error) {
        if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Makanan tidak ditemukan.' });
        }
        if (error.code === 'P2002') {
            return res.status(400).json({ message: 'Nama makanan sudah ada.' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// D = Delete
export const deleteFood = async (req, res) => {
    const { id } = req.params;

    try {
        await FoodModel.remove(id);
        res.status(200).json({ message: 'Data makanan berhasil dihapus.' });
    } catch (error) {
        if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Makanan tidak ditemukan.' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};