import { type DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */

  enum Role {
    USER,
    COACH,
    MANAGER,
    ADMIN,
  }
  interface Session {
    user?: {
      id: string;
      role: Role<string>;
    } & DefaultSession["user"];
  }
}
