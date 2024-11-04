import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const testRouter = createTRPCRouter({
    testing: publicProcedure
        .input(z.object({
            text: z.string()
        })).query(({input}) => {
            return {
                test: `${input.text}, this is a test message!`
            }
        })
})