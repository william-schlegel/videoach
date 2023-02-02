import { router } from "../trpc";
import { activityRouter } from "./activities";
import { calendarRouter } from "./calendar";
import { clubRouter } from "./clubs";
import { coachRouter } from "./coachs";
import { dashboardRouter } from "./dashboard";
import { eventRouter } from "./event";
import { fileRouter } from "./files";
import { notificationRouter } from "./notification";
import { pageRouter } from "./page";
import { planningRouter } from "./planning";
import { pricingRouter } from "./pricing";
import { siteRouter } from "./sites";
import { subscriptionRouter } from "./subscription";
import { userRouter } from "./users";

export const appRouter = router({
  users: userRouter,
  clubs: clubRouter,
  sites: siteRouter,
  activities: activityRouter,
  dashboards: dashboardRouter,
  calendars: calendarRouter,
  pricings: pricingRouter,
  coachs: coachRouter,
  files: fileRouter,
  pages: pageRouter,
  plannings: planningRouter,
  subscriptions: subscriptionRouter,
  events: eventRouter,
  notifications: notificationRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
