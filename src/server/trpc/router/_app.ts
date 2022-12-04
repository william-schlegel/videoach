import { router } from "../trpc";
import { authRouter } from "./auth";
import { clubRouter } from "./clubs";
import { exampleRouter } from "./example";
import { siteRouter } from "./sites";
import { userRouter } from "./users";

export const appRouter = router({
  example: exampleRouter,
  auth: authRouter,
  users: userRouter,
  clubs: clubRouter,
  sites: siteRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
