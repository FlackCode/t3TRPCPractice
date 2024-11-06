import { type PrismaClient } from "@prisma/client";
import { type IncomingMessage, type ServerResponse } from "http";

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
  req: IncomingMessage & {
    cookies: Record<string, string>;
  };
  res: ServerResponse;
  user: TRPCUser | null;
  session: Session | null;
}