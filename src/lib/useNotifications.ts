import type { UserNotification } from "@prisma/client";
import { trpc } from "@trpcclient/trpc";
import { useState } from "react";
import { isCUID } from "./checkValidity";

function useNotifications(userId: string | undefined | null) {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unread, setUnread] = useState(0);

  const getNotifications = trpc.notifications.getNotificationToUser.useQuery(
    { userToId: userId ?? "" },
    {
      enabled: isCUID(userId),
      onSuccess(data) {
        if (data) {
          setNotifications(data.notifications);
          setUnread(data.unread);
        }
      },
      refetchInterval: 30000,
    }
  );

  return { isLoading: getNotifications.isLoading, notifications, unread };
}
export default useNotifications;
