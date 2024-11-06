import { type PrismaClient } from "@prisma/client";
import { type ResponseCookies } from "next/dist/compiled/@edge-runtime/cookies";
import { type NextRequest } from "next/server";

export interface TRPCUser {
  id: string;
  email: string;
  fullName: string;
}

export interface Session {
  id: string;
  userId: string;
  expires: Date;
  user: TRPCUser;
}

export interface TRPCContext {
  db: PrismaClient;
  req: NextRequest;
  user: TRPCUser | null;
  session: Session | null;
}