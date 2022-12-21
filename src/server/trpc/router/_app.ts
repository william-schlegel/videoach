import { router } from "../trpc";
import { activityRouter } from "./activities";
import { calendarRouter } from "./calendar";
import { clubRouter } from "./clubs";
import { dashboardRouter } from "./dashboard";
import { pricingRouter } from "./pricing";
import { siteRouter } from "./sites";
import { userRouter } from "./users";

export const appRouter = router({
  users: userRouter,
  clubs: clubRouter,
  sites: siteRouter,
  activities: activityRouter,
  dashboards: dashboardRouter,
  calendars: calendarRouter,
  pricings: pricingRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
