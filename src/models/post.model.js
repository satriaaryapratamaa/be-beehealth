import { Prisma } from "@prisma/client";

export const create = (userId, deskripsi, imageURL) => {
    return prisma.post.create({
        data: { 
            userId: userId,
            deskripsi: deskripsi,
            imageURL: imageURL || null
        },
    });
}

