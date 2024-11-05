/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const userRouter = createTRPCRouter({
    createUser: publicProcedure.input(z.object({
        fullName: z.string().min(1, "Enter your full name"),
        email: z.string().email("Please enter a valid email"),
        password: z.string().min(6, "Password must be at least 6 characters long"),
    })).mutation(async ({ctx, input}) => {
        return ctx.db.tRPCUser.create({
            data: {
                email: input.email,
                fullName: input.fullName,
                password: input.password,
            }
        })
    }),
    getUser: publicProcedure.input(z.object({
        email: z.string().email("Please enter a valid email"),
        password: z.string().min(6, "Password must be at least 6 characters long"),
    })).mutation(async ({ctx, input}) => {
        return ctx.db.tRPCUser.findFirst({
            where: {email: input.email, password: input.password}
        })
    }),
})