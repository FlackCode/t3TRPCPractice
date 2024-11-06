/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { compare, hash } from 'bcrypt'
import { TRPCError } from "@trpc/server";
import { cookies } from "next/headers";

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
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week
          }
        })
        
        // Set the cookie
        cookies().set({
          name: 'sessionId',
          value: session.id, // whatever your session ID is
          maxAge: 60 * 60 * 24, // set an appropriate max age
          path: '/',
          sameSite: 'lax',  // 'lax' is usually a good option for local development
          secure: false,     // ensure secure is false for localhost
          domain: 'localhost' // explicitly set for localhost
        });
        
    
        console.log('Login - Cookie set:', session.id);
    
        return { id: user.id, email: user.email, fullName: user.fullName };
      }),
    
      logout: protectedProcedure.mutation(async ({ctx}) => {
        if (!ctx.session) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'No active session found'
          });
        }
        
        await ctx.db.session.delete({
          where: { id: ctx.session.id }
        });
    
        cookies().set({
          name: 'sessionId',
          value: '',
          maxAge: 0, // Set maxAge to 0 to delete the cookie
          path: '/',
        });
        
    
        console.log('Logout - Cookie deleted');
    
        return { success: true };
      }),
    
    
});

