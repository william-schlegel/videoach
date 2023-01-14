import type {
  Activity,
  Club,
  Planning,
  PlanningActivity,
  Room,
  Site,
  User,
} from "@prisma/client";
import { DayName } from "@prisma/client";
import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../trpc";

const planningObject = z.object({
  id: z.string().cuid(),
  clubId: z.string().cuid(),
  startDate: z.date().default(new Date(Date.now())),
  siteId: z.string().cuid().optional(),
  roomId: z.string().cuid().optional(),
  endDate: z.date().optional(),
  name: z.string().optional(),
});

const planningActivityObject = z.object({
  id: z.string().cuid(),
  planningId: z.string().cuid(),
  activityId: z.string().cuid(),
  siteId: z.string().cuid(),
  roomId: z.string().cuid().optional(),
  day: z.nativeEnum(DayName),
  startTime: z.string(),
  duration: z.number(),
  coachId: z.string().cuid().optional(),
});

export const planningRouter = router({
  getPlanningsForClub: protectedProcedure
    .input(z.string())
    .query(({ ctx, input }) =>
      ctx.prisma.planning.findMany({
        where: { clubId: input },
        orderBy: { startDate: "desc" },
      })
    ),

  getPlanningById: protectedProcedure
    .input(z.string().cuid())
    .query(({ ctx, input }) =>
      ctx.prisma.planning.findUnique({
        where: { id: input },
        include: {
          planningActivities: {
            include: {
              activity: true,
              site: true,
              room: true,
              coach: true,
            },
          },
          site: {
            select: { name: true },
          },
          room: {
            select: { name: true },
          },
        },
      })
    ),
  getPlanningActivityById: protectedProcedure
    .input(z.string().cuid().nullable())
    .query(({ ctx, input }) => {
      if (!input) return null;
      return ctx.prisma.planningActivity.findUnique({
        where: { id: input },
        include: {
          activity: true,
          site: {
            include: { rooms: true },
          },
          room: true,
          coach: true,
        },
      });
    }),
  createPlanningForClub: protectedProcedure
    .input(planningObject.omit({ id: true }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.planning.create({
        data: input,
      })
    ),
  updatePlanningForClub: protectedProcedure
    .input(planningObject.partial())
    .mutation(({ ctx, input }) =>
      ctx.prisma.planning.update({
        where: { id: input.id },
        data: input,
      })
    ),
  duplicatePlanningForClub: protectedProcedure
    .input(planningObject.partial())
    .mutation(async ({ ctx, input }) => {
      const org = await ctx.prisma.planning.findUnique({
        where: { id: input.id },
        include: { planningActivities: true },
      });
      if (!org) return null;
      return ctx.prisma.planning.create({
        data: {
          clubId: org.clubId,
          name: input.name ?? org.name,
          startDate: input.startDate,
          endDate: input.endDate,
          siteId: org.siteId,
          roomId: org.roomId,
          planningActivities: {
            createMany: {
              data: org.planningActivities.map((pa) => ({
                day: pa.day,
                startTime: pa.startTime,
                duration: pa.duration,
                activityId: pa.activityId,
                coachId: pa.coachId,
                siteId: pa.siteId,
                roomId: pa.roomId,
              })),
            },
          },
        },
      });
    }),
  deletePlanning: protectedProcedure
    .input(z.string())
    .mutation(({ ctx, input }) =>
      ctx.prisma.planning.delete({
        where: { id: input },
      })
    ),
  addPlanningActivity: protectedProcedure
    .input(planningActivityObject.omit({ id: true }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.planningActivity.create({ data: input })
    ),
  updatePlanningActivity: protectedProcedure
    .input(planningActivityObject.partial())
    .mutation(({ ctx, input }) =>
      ctx.prisma.planningActivity.update({
        where: { id: input.id },
        data: input,
      })
    ),
  deletePlanningActivity: protectedProcedure
    .input(z.string())
    .mutation(({ ctx, input }) =>
      ctx.prisma.planningActivity.delete({
        where: { id: input },
      })
    ),
  getClubDailyPlanning: publicProcedure
    .input(
      z.object({
        clubId: z.string().cuid(),
        day: z.nativeEnum(DayName),
      })
    )
    .query(async ({ ctx, input }) => {
      const planning = await ctx.prisma.planning.findFirst({
        where: {
          clubId: input.clubId,
          startDate: {
            lte: new Date(Date.now()),
          },
        },
        include: {
          club: true,
          planningActivities: {
            where: {
              day: input.day,
            },
            include: {
              activity: true,
              coach: true,
              room: true,
              site: true,
            },
          },
        },
      });
      // TODO: manage exception days
      return planning;
    }),
  getCoachDailyPlanning: protectedProcedure
    .input(
      z.object({
        coachId: z.string().cuid(),
        day: z.nativeEnum(DayName),
      })
    )
    .query(async ({ ctx, input }) => {
      const planning = await ctx.prisma.planning.findMany({
        where: {
          startDate: {
            lte: new Date(Date.now()),
          },
        },
        include: {
          club: true,
          planningActivities: {
            where: {
              day: input.day,
              coachId: input.coachId,
            },
            include: {
              activity: true,
              coach: true,
              room: true,
              site: true,
            },
          },
        },
      });
      // TODO: manage exception days
      return planning;
    }),
  getMemberDailyPlanning: protectedProcedure
    .input(
      z.object({
        memberId: z.string().cuid(),
        day: z.nativeEnum(DayName),
      })
    )
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.memberId },
        include: {
          subscriptions: {
            include: {
              activitieGroups: true,
              activities: true,
              rooms: true,
              sites: true,
            },
          },
        },
      });
      const clubIds = Array.from(
        new Set(user?.subscriptions.map((s) => s.clubId))
      );

      const planningClubs = await ctx.prisma.planning.findMany({
        where: {
          startDate: {
            lte: new Date(Date.now()),
          },
          clubId: {
            in: clubIds,
          },
        },
        include: { club: true },
      });

      const planning: (Planning & {
        club: Club;
        activities: (PlanningActivity & {
          site: Site;
          room: Room | null;
          activity: Activity;
          coach: User | null;
        })[];
        withNoCalendar: (Activity & {
          site: {
            name: string;
          } | null;
          room: {
            name: string;
          } | null;
        })[];
      })[] = [];

      for (const planningClub of planningClubs) {
        const sub = user?.subscriptions.filter(
          (s) => s.clubId === planningClub.clubId
        );

        type TIn = { in: string[] };
        type TFilter = {
          activityId?: TIn;
          activity?: { groupId: TIn };
          siteId?: TIn;
          roomId?: TIn;
        };
        const where: {
          day: DayName;
          planningId: string;
          OR?: TFilter[];
        } = {
          day: input.day,
          planningId: planningClub.id,
        };
        type TFilterNC = {
          id?: TIn;
          groupId?: TIn;
        };

        const whereNoCal: {
          clubId: string;
          noCalendar: boolean;
          OR?: TFilterNC[];
        } = {
          clubId: planningClub.clubId,
          noCalendar: true,
        };

        for (const s of sub ?? []) {
          let fAct: TIn | null = null;
          let fGAct: TIn | null = null;
          let fSite: TIn | null = null;
          let fRoom: TIn | null = null;

          if (s.mode === "ACTIVITY_GROUP")
            fGAct = {
              in: s?.activitieGroups.map((ag) => ag.id),
            };
          if (s.mode === "ACTIVITY")
            fAct = {
              in: s.activities.map((a) => a.id),
            };
          if (s.restriction === "SITE") {
            const sites = s.sites.map((s) => s.id);
            fSite = { in: sites };
          }
          if (s.restriction === "ROOM") {
            const rooms = s.rooms.map((s) => s.id);
            fRoom = { in: rooms };
          }
          const filter: TFilter = {};
          if (fGAct) filter.activity = { groupId: fGAct };
          if (fAct) filter.activityId = fAct;
          if (fSite) filter.siteId = fSite;
          if (fRoom) filter.roomId = fRoom;
          if (Object.keys(filter).length) {
            if (!where.OR) where.OR = [];
            where.OR.push(filter);
          }
          const filterNC: TFilterNC = {};
          if (fGAct) filterNC.groupId = fGAct;
          if (fAct) filterNC.id = fAct;
          if (Object.keys(filterNC).length) {
            if (!whereNoCal.OR) whereNoCal.OR = [];
            whereNoCal.OR.push(filterNC);
          }
        }
        console.log("where", where);

        const pa = await ctx.prisma.planningActivity.findMany({
          where,
          include: {
            activity: true,
            coach: true,
            room: true,
            site: true,
          },
        });
        const withNoCalendar = await ctx.prisma.activity.findMany({
          where: whereNoCal,
          include: {
            site: { select: { name: true } },
            room: { select: { name: true } },
          },
        });

        planning.push({ ...planningClub, activities: pa, withNoCalendar });
      }

      // TODO: manage exception days
      return planning;
    }),
});
