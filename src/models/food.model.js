import { prisma } from '../lib/prisma.js';

// C = Create
export const create = async (data) => {
    return prisma.food.create({
        data: {
            nama: data.nama,
            kalori: parseFloat(data.kalori),
            protein: parseFloat(data.protein),
            carbs: parseFloat(data.carbs),
            fat: parseFloat(data.fat),
        },
    });
};

// R = Read (All with Search)
export const findAll = async (searchTerm) => {
    let queryOptions = {
        orderBy: {
            nama: 'asc'
        }
    };

    if (searchTerm) {
        queryOptions.where = {
            nama: {
                contains: searchTerm,
                mode: 'insensitive',
            },
        };
    }
    return prisma.food.findMany(queryOptions);
};

// R = Read (One by ID)
export const findById = async (id) => {
    return prisma.food.findUnique({
        where: { id: id },
    });
};

// U = Update
export const update = async (id, data) => {
    return prisma.food.update({
        where: { id: id },
        data: {
            nama: data.nama,
            kalori: parseFloat(data.kalori),
            protein: parseFloat(data.protein),
            carbs: parseFloat(data.carbs),
            fat: parseFloat(data.fat),
        },
    });
};

// D = Delete
export const remove = async (id) => {
    return prisma.food.delete({
        where: { id: id },
    });
};