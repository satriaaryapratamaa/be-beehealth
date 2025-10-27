// src/lib/prisma.js

import { PrismaClient } from '@prisma/client';

// Buat satu instance dan ekspor
export const prisma = new PrismaClient();