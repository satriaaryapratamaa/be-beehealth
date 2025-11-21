import { Prisma } from "@prisma/client";

export const create = (userId, deskripsi, imageURL) => {
    return prisma.post.create({
        data: { 
            userId: userId,
            deskripsi: deskripsi,
            imageURL: imageURL || null,
        },
    });
}

export const findAll = () => {
    return prisma.post.findMany({
        orderBy: {
            sharedDate: 'desc',
        },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    nama: true,
                },
            },
        },
        Comment: {
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                    },
                },
            },
            orderBy: {
                date: 'desc',
            },
        },
    });
};

export const remove = (id) => {
    return prisma.post.delete({
        where: { id: id },
    });
};

export const toggleLike = async (userId, postId) => {
    const existingLike = await prisma.like.findUnique({
        where: {
            userId_postId: { 
            userId: userId,
            postId: postId,
            },
        },
    });

    if (existingLike) {
    
        await prisma.like.delete({
            where: { id: existingLike.id },
        });
        return { action: 'unliked' };
    } else {
    
        const newLike = await prisma.like.create({
            data: {
                userId: userId,
                postId: postId,
            },
        });
        return { action: 'liked', data: newLike };
    }
};


export const createComment = (userId, postId, text) => {
    return prisma.comment.create({
        data: {
        userId,
        postId,
        text,
        },
    include: { 
        user: {
            select: {
            id: true,
            nama: true,
            username: true
            }
        }
        }
    });
};