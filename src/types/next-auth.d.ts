import type { DefaultSession, DefaultUser } from "next-auth";
import type { Role } from "@prisma/client";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */

  interface Session {
    user?: {
      id: string;
      role: Role<string>;
    } & DefaultSession["user"];
  }
  interface User extends DefaultUser {
    role: Role<string>;
  }
}
