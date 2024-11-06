/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */
import { initTRPC, TRPCError } from "@trpc/server";
import { cookies } from "next/headers";
import { type NextRequest } from "next/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { db } from "~/server/db";
import { type Session, type TRPCUser, type TRPCContext } from "~/types";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */
export const createTRPCContext = async (opts: { req: NextRequest }): Promise<TRPCContext> => {
  const { req } = opts;
  
  let user: TRPCUser | null = null;
  let session: Session | null = null;

  const cookieStore = cookies();
  const sessionId = cookieStore.get('sessionId')?.value;

  console.log('createTRPCContext - SessionId from cookie:', sessionId);

  if (sessionId) {
    try {
      const dbSession = await db.session.findUnique({
        where: { id: sessionId },
        include: { user: true },
      });

      console.log('createTRPCContext - Session from DB:', dbSession);

      if (dbSession && dbSession.expires > new Date()) {
        session = dbSession;
        user = dbSession.user;
      } else if (dbSession) {
        await db.session.delete({ where: { id: sessionId } });
        cookieStore.set({
          name: 'sessionId',
          value: '',
          maxAge: 0,
          path: '/',
        });
        console.log('createTRPCContext - Expired session deleted and cookie cleared');
      }
    } catch (error) {
      console.error("Error fetching session:", error);
    }
  }

  return {
    db,
    req,
    user,
    session,
  };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Create a server-side caller.
 *
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Middleware for timing procedure execution and adding an artificial delay in development.
 *
 * You can remove this if you don't like it, but it can help catch unwanted waterfalls by simulating
 * network latency that would occur in production but not in local development.
 */
const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  if (t._config.isDev) {
    // artificial delay in dev
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();

  const end = Date.now();
  console.log(`[TRPC] ${path} took ${end - start}ms to execute`);

  return result;
});

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure.use(timingMiddleware);

export const protectedProcedure = t.procedure.use(async (opts) => {
  const { ctx } = opts;
  const sessionId = ctx.req.cookies.get('sessionId')?.value;

  console.log('Protected Procedure - SessionId from cookie:', sessionId);

  if (!sessionId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "No session found" });
  }

  const session = await ctx.db.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });

  console.log('Protected Procedure - Session from DB:', session);

  if (!session || session.expires < new Date()) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid or expired session" });
  }

  return opts.next({
    ctx: {
      ...ctx,
      user: session.user,
      session: session,
    },
  });
});