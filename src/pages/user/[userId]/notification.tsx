/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { trpc } from "@trpcclient/trpc";
import Spinner from "@ui/spinner";
import {
  type InferGetServerSidePropsType,
  type GetServerSidePropsContext,
} from "next";
import { unstable_getServerSession } from "next-auth";
import { authOptions } from "@auth/[...nextauth]";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18nConfig from "@root/next-i18next.config.mjs";
import { useTranslation } from "next-i18next";
import Link from "next/link";
import { useRouter } from "next/router";
import Layout from "@root/src/components/layout";
import { isCUID } from "@lib/checkValidity";
import createLink from "@lib/createLink";
import { formatDateLocalized } from "@lib/formatDate";
import Pagination from "@ui/pagination";
import { NotificationType, type UserNotification } from "@prisma/client";
import { isDate } from "date-fns";
import { toast } from "react-toastify";

const PER_PAGE = 20;

const ManageNotifications = ({
  userId,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const notificationId = router.query.notificationId as string;
  const notificationQuery = trpc.notifications.getNotificationToUser.useQuery(
    { userToId: userId, skip: page * PER_PAGE, take: PER_PAGE },
    {
      onSuccess(data) {
        if (!notificationId)
          router.push(
            createLink({
              notificationId: data.notifications[0]?.id,
              page: page.toString(),
            })
          );
      },
    }
  );
  const { t } = useTranslation("auth");

  return (
    <Layout
      title={t("notification.my-notification", {
        count: notificationQuery.data?.notifications.length ?? 0,
      })}
      className="container mx-auto my-2 space-y-2 p-2"
    >
      <div className="mb-4 flex flex-row items-center gap-4">
        <h1>
          {t("notification.my-notification", {
            count: notificationQuery.data?.notifications.length ?? 0,
          })}
        </h1>
      </div>
      <div className="flex gap-4">
        {notificationQuery.isLoading ? (
          <Spinner />
        ) : (
          <>
            <ul className="menu w-1/4 overflow-hidden rounded bg-base-100">
              {notificationQuery.data?.notifications.map((notification) => (
                <li key={notification.id}>
                  <Link
                    href={createLink({
                      notificationId: notification.id,
                      page: page.toString(),
                    })}
                    className={`w-full text-center ${
                      notificationId === notification.id ? "active" : ""
                    }`}
                  >
                    {formatDateLocalized(notification.date, {
                      dateFormat: "short",
                      withTime: true,
                    })}
                  </Link>
                </li>
              ))}
            </ul>
            <Pagination
              actualPage={page}
              count={notificationQuery.data?.total ?? 0}
              onPageClick={(page) => setPage(page)}
              perPage={PER_PAGE}
            />
          </>
        )}
        {notificationId === "" ? null : (
          <NotificationContent notificationId={notificationId} />
        )}
      </div>
    </Layout>
  );
};

export default ManageNotifications;

type NotificationContentProps = {
  notificationId: string;
};

export function NotificationContent({
  notificationId,
}: NotificationContentProps) {
  const notification = trpc.notifications.getNotificationById.useQuery(
    { notificationId },
    { enabled: isCUID(notificationId) }
  );
  const { t } = useTranslation("auth");
  const { getName } = useNotificationType();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="avatar">
          <div className="w-16 rounded">
            <img
              src={notification.data?.userFrom.image ?? "/images/dummy.jpg"}
              alt={notification.data?.userFrom.name ?? ""}
            />
          </div>
        </div>
        <span className="text-lg font-bold text-secondary">
          {notification.data?.userFrom.name ?? ""}
        </span>
        <h2>
          {formatDateLocalized(notification.data?.date, {
            dateFormat: "long",
            withDay: true,
            withTime: true,
          })}
        </h2>
        {notification.data?.viewDate ? (
          <span>
            {t("notification.viewed", {
              date: formatDateLocalized(notification.data?.viewDate, {
                dateFormat: "long",
                withTime: true,
              }),
            })}
          </span>
        ) : null}
      </div>
      <div className="space-y-4 rounded border border-primary p-4">
        <div className="badge-info badge">
          {t("notification.notification-type", {
            type: getName(notification.data?.type),
          })}
        </div>
        <p>{notification.data?.message}</p>
        {notification.data ? (
          <NotificationInteraction notification={notification.data} />
        ) : null}
      </div>
    </div>
  );
}
type NotificationInteractionProps = {
  notification: UserNotification & {
    userFrom: {
      name: string | null;
      image: string | null;
    };
  };
};

function NotificationInteraction({
  notification,
}: NotificationInteractionProps) {
  const utils = trpc.useContext();
  const { t } = useTranslation("auth");

  async function handleClick(link: string | null, id: string) {
    if (!link) return;
    const sp = new URLSearchParams({ notificationId: id });
    const url = link.concat("?", sp.toString());
    console.log("url", url);
    const res = await fetch(url);
    const json = await res.json();
    if (json.trpcerror) {
      toast.error(json.error);
    } else if (json.error) {
      toast.error(t(json.error));
    } else if (json.success) {
      toast.success(t(json.success));
      utils.notifications.getNotificationById.invalidate({
        notificationId: notification.id,
      });
    }
  }

  if (isDate(notification.answered))
    return (
      <div className="flex items-center gap-2">
        <span>
          {t("notification.answered", {
            date: formatDateLocalized(notification.answered, {
              dateFormat: "long",
              withTime: true,
            }),
          })}
        </span>
        <span className="badge-primary badge">
          {t(notification.answer ?? "")}
        </span>
      </div>
    );
  if (notification.type === "SEARCH_COACH") {
    return (
      <div className="flex items-center gap-2">
        <button
          className="btn-success btn"
          type="button"
          onClick={() =>
            handleClick("/api/notification/acceptSearchCoach", notification.id)
          }
        >
          {t("notification.accept")}
        </button>
        <button
          className="btn-error btn"
          type="button"
          onClick={() =>
            handleClick("/api/notification/refuseSearchCoach", notification.id)
          }
        >
          {t("notification.refuse")}
        </button>
      </div>
    );
  }
  return null;
}

const NOTIFICATION_TYPES: readonly {
  readonly value: NotificationType;
  readonly label: string;
}[] = [
  {
    value: NotificationType.SEARCH_COACH,
    label: "notification.type.search-coach",
  },
  {
    value: NotificationType.COACH_ACCEPT,
    label: "notification.type.coach-accept",
  },
  {
    value: NotificationType.COACH_REFUSE,
    label: "notification.type.coach-refuse",
  },
  {
    value: NotificationType.SEARCH_CLUB,
    label: "notification.type.search-club",
  },
  {
    value: NotificationType.CLUB_ACCEPT,
    label: "notification.type.club-accept",
  },
  {
    value: NotificationType.CLUB_REFUSE,
    label: "notification.type.club-refuse",
  },
  {
    value: NotificationType.NEW_MESSAGE,
    label: "notification.type.new-message",
  },
];

function useNotificationType() {
  const { t } = useTranslation("auth");
  function getName(type: NotificationType | undefined) {
    if (!type) return "?";
    const nt = NOTIFICATION_TYPES.find((t) => t.value === type);
    return nt?.label ? t(nt.label) : "?";
  }
  function getList() {
    return NOTIFICATION_TYPES.map((nt) => ({
      value: nt.value,
      label: t(nt.label),
    }));
  }
  return { getName, getList };
}

export const getServerSideProps = async ({
  locale,
  req,
  res,
}: GetServerSidePropsContext) => {
  const session = await unstable_getServerSession(req, res, authOptions);
  if (!session?.user)
    return {
      redirect: "/",
      permanent: false,
    };

  return {
    props: {
      ...(await serverSideTranslations(
        locale ?? "fr",
        ["common", "auth"],
        nextI18nConfig
      )),
      userId: session?.user?.id || "",
    },
  };
};
