/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { compare, hash } from 'bcrypt'
import { TRPCError } from "@trpc/server";

export const userRouter = createTRPCRouter({
    createUser: publicProcedure.input(z.object({
        fullName: z.string().min(1, "Enter your full name"),
        email: z.string().email("Please enter a valid email"),
        password: z.string().min(6, "Password must be at least 6 characters long"),
    })).mutation(async ({ctx, input}) => {
        const existingUser = await ctx.db.tRPCUser.findUnique({
            where: {email: input.email}
        })
        if (existingUser) {
            throw new TRPCError({
                code: 'CONFLICT',
                message: 'User with this email already exists'
            })
        }
        const hashedPassword = await hash(input.password, 10)
        const newUser = await ctx.db.tRPCUser.create({
            data: {
                email: input.email,
                fullName: input.fullName,
                password: hashedPassword,
            }
        })
        return { id: newUser.id, email: newUser.email, fullName: newUser.fullName };
    }),
    currentUser: protectedProcedure.query(async ({ ctx }) => {
        return ctx.user;
    }),
    login: publicProcedure.input(z.object({
        email: z.string().email(),
        password: z.string(),
    })).mutation(async ({ctx, input}) => {
        const user = await ctx.db.tRPCUser.findUnique({
            where: {email: input.email}
        })
        if (!user) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'User not found'
            })
        }
        const isPasswordValid = await compare(input.password, user.password);
        if (!isPasswordValid) {
            throw new TRPCError({
                code: 'UNAUTHORIZED',
                message: 'Invalid Password'
            })
        }
        const session = await ctx.db.session.create({
            data: {
                userId: user.id,
                expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) //1 week
            }
        })
        ctx.res.setHeader('Set-Cookie', `sessionId=${session.id}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}`);
        return { id: user.id, email: user.email, fullName: user.fullName };
    }),

})