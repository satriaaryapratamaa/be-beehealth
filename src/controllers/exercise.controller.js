// src/controllers/exercise.controller.js

import * as ExerciseModel from '../models/exercise.model.js';

// C = Create
export const createExercise = async (req, res) => {
  const { namaKegiatan, caloriesBurnPerMinute } = req.body;
  if (!namaKegiatan || !caloriesBurnPerMinute) {
    return res.status(400).json({ message: 'Semua field wajib diisi.' });
  }

  try {
    const newExercise = await ExerciseModel.create(req.body);
    res.status(201).json({ message: 'Data olahraga berhasil ditambahkan', data: newExercise });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Nama olahraga sudah ada.' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// R = Read (All)
export const getAllExercises = async (req, res) => {
  const { search } = req.query;
  try {
    const exercises = await ExerciseModel.findAll(search);
    res.status(200).json({ data: exercises });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// R = Read (One)
export const getExerciseById = async (req, res) => {
  const { id } = req.params;
  try {
    const exercise = await ExerciseModel.findById(id);
    if (!exercise) {
      return res.status(404).json({ message: 'Olahraga tidak ditemukan.' });
    }
    res.status(200).json({ data: exercise });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// U = Update
export const updateExercise = async (req, res) => {
  const { id } = req.params;
  try {
    const updatedExercise = await ExerciseModel.update(id, req.body);
    res.status(200).json({ message: 'Data olahraga berhasil diupdate', data: updatedExercise });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Olahraga tidak ditemukan.' });
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Nama olahraga sudah ada.' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// D = Delete
export const deleteExercise = async (req, res) => {
  const { id } = req.params;
  try {
    await ExerciseModel.remove(id);
    res.status(200).json({ message: 'Data olahraga berhasil dihapus.' });
  } catch (error)
 {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Olahraga tidak ditemukan.' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};