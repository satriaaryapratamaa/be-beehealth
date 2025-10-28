// src/models/exercise.model.js

import { prisma } from '../lib/prisma.js';

// C = Create
export const create = (data) => {
    return prisma.exercise.create({
        data: {
            namaKegiatan: data.namaKegiatan,
            caloriesBurnPerMinute: parseFloat(data.caloriesBurnPerMinute),
        },
    });
};

// R = Read (All with Search)
export const findAll = (searchTerm) => {
    let queryOptions = {
        orderBy: {
        namaKegiatan: 'asc'
        }
    };

    if (searchTerm) {
        queryOptions.where = {
            namaKegiatan: {
            contains: searchTerm,
            mode: 'insensitive',
            },
        };
    }
    return prisma.exercise.findMany(queryOptions);
};

// R = Read (One by ID)
export const findById = (id) => {
    return prisma.exercise.findUnique({
        where: { id: id },
    });
};

// U = Update
export const update = (id, data) => {
    return prisma.exercise.update({
        where: { id: id },
        data: {
            namaKegiatan: data.namaKegiatan,
            caloriesBurnPerMinute: parseFloat(data.caloriesBurnPerMinute),
        },
    });
};

// D = Delete
export const remove = (id) => {
    return prisma.exercise.delete({
        where: { id: id },
    });
};