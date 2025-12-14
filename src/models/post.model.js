import { prisma } from '../lib/prisma.js';

export const create = (userId, deskripsi, imageUrl) => {
    return prisma.post.create({
        data: { 
            userId: userId,
            deskripsi: deskripsi,
            imageUrl: imageUrl || null,
        },
    });
}

export const findAll = async (userId) => {
    const posts= await prisma.post.findMany({
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
            comments: {
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            nama: true,
                        },
                    },
                },
                orderBy: {
                    date: 'desc',
                },
            },
            likes: {
                select: {
                    userId: true,
                }
            }
        },
    });

    const result = posts.map(post => {
        const { likes, ...rest } = post;

        return {
            ...rest,
            liked: likes.some(like => like.userId === userId),
            likesCount: likes.length,
        }
    });

    return result;


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