import { getServerAuthSession } from "@root/src/server/common/get-server-auth-session";
import { type NextApiRequest, type NextApiResponse } from "next";
import { TRPCError } from "@trpc/server";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";
import { appRouter } from "@trpcserver/router/_app";
import { PrismaClient } from "@prisma/client";
import { isCUID } from "@lib/checkValidity";

type ResponseData = {
  success?: string;
  error?: string;
  trpcerror?: string;
};

const acceptSearchCoach = async (
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) => {
  const session = await getServerAuthSession({ req, res });
  const prisma = new PrismaClient({ log: ["error"] });

  const caller = appRouter.createCaller({ session, prisma });

  const notificationId = req.query.notificationId as string;

  if (!notificationId || !isCUID(notificationId))
    return res
      .status(500)
      .json({ error: "common:api.error-accept-search-coach" });

  if (session) {
    try {
      const notification = await caller.notifications.getNotificationById({
        notificationId: notificationId,
        noUpdate: true,
      });
      if (!notification)
        return res
          .status(500)
          .json({ error: "common:api.error-accept-search-coach" });
      const { clubId, coachDataId } = notification.data as {
        clubId: string;
        coachDataId: string;
      };
      if (!isCUID(clubId) || !isCUID(coachDataId))
        return res
          .status(500)
          .json({ error: "common:api.error-accept-search-coach" });
      const updated = await caller.clubs.updateClubCoach({
        clubId,
        coachUserId: coachDataId,
      });
      if (updated) {
        // create aswer notification
        const answer = await caller.notifications.createNotificationToUser({
          from: notification.userToId,
          to: notification.userFromId,
          type: "COACH_ACCEPT",
          message: "",
          linkedNotification: notification.id,
        });
        // update notification answered
        await caller.notifications.updateNotification({
          id: notificationId,
          answered: new Date(Date.now()),
          answer: "common:api.accept",
          linkedNotification: answer.id,
        });
      }
      res.status(200).json({ success: "common:api.coach-added" });
    } catch (e) {
      if (e instanceof TRPCError) {
        // We can get the specific HTTP status code coming from tRPC (e.g. 404 for `NOT_FOUND`).
        const httpStatusCode = getHTTPStatusCodeFromError(e);

        res.status(httpStatusCode).json({ trpcerror: e.message });
        return;
      }
      res.status(500).json({ error: "common:api.error" });
    }
  }
};

export default acceptSearchCoach;
