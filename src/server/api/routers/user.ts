/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const userRouter = createTRPCRouter({
    createUser: publicProcedure.input(z.object({
        fullName: z.string(),
        email: z.string().email(),
        password: z.string().min(6),
    })).mutation(async ({ctx, input}) => {
        return ctx.db.tRPCUser.create({
            data: {
                email: input.email,
                fullName: input.fullName,
                password: input.password,
            }
        })
    })
})