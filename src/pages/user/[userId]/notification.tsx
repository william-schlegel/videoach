/* eslint-disable @next/next/no-img-element */
import { Fragment, useState } from "react";
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
import { NotificationType } from "@prisma/client";
import { isDate } from "date-fns";
import { toast } from "react-toastify";
import { type GetNotificationByIdReturn } from "@trpcserver/router/notification";

const PER_PAGE = 20;

type FromTo = "from" | "to";

const ManageNotifications = ({
  userId,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const fromTo = (router.query.fromTo ?? "to") as FromTo;
  const notificationId = router.query.notificationId as string;
  const notificationQuery = trpc.notifications.getNotificationToUser.useQuery(
    {
      userToId: fromTo === "to" ? userId : undefined,
      userFromId: fromTo === "from" ? userId : undefined,
      skip: page * PER_PAGE,
      take: PER_PAGE,
    },
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
          <div className="w-1/4 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Link
                className={`btn-primary btn ${
                  fromTo === "to" ? "" : "btn-outline"
                }`}
                href={createLink({
                  notificationId: "",
                  page: "0",
                  fromTo: "to",
                })}
              >
                {t("notification.to")}
              </Link>
              <Link
                className={`btn-primary btn ${
                  fromTo === "from" ? "" : "btn-outline"
                }`}
                href={createLink({
                  notificationId: "",
                  page: "0",
                  fromTo: "from",
                })}
              >
                {t("notification.from")}
              </Link>
            </div>
            <ul className="menu w-full overflow-hidden rounded bg-base-100">
              {notificationQuery.data?.notifications.map((notification) => (
                <li key={notification.id}>
                  <Link
                    href={createLink({
                      notificationId: notification.id,
                      page: page.toString(),
                      fromTo,
                    })}
                    className={`flex items-center justify-between ${
                      notificationId === notification.id ? "active" : ""
                    } ${
                      notification.viewDate ? "" : "font-bold text-secondary"
                    }`}
                  >
                    <div>
                      {formatDateLocalized(notification.date, {
                        dateFormat: "short",
                        withTime: true,
                      })}
                    </div>
                    <div className="space-x-2">
                      {notification.type === "COACH_ACCEPT" ||
                      notification.type === "CLUB_ACCEPT" ? (
                        <i className="bx bx-happy-heart-eyes bx-xs rounded-full bg-success p-2 text-success-content" />
                      ) : null}
                      {notification.type === "COACH_REFUSE" ||
                      notification.type === "CLUB_REFUSE" ? (
                        <i className="bx bx-x bx-xs rounded-full bg-error p-2 text-error-content" />
                      ) : null}
                      {notification.type === "SEARCH_COACH" ||
                      notification.type === "SEARCH_CLUB" ? (
                        <i className="bx bx-question-mark bx-xs rounded-full bg-secondary p-2 text-secondary-content" />
                      ) : null}
                      {notification.answered ? (
                        <i className="bx bx-check bx-xs rounded-full bg-success p-2 text-success-content" />
                      ) : null}
                    </div>
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
          </div>
        )}
        {notificationId === "" ? null : (
          <NotificationContent
            notificationId={notificationId}
            fromTo={fromTo}
          />
        )}
      </div>
    </Layout>
  );
};

export default ManageNotifications;

type NotificationContentProps = {
  notificationId: string;
  fromTo: FromTo;
};

export function NotificationContent({
  notificationId,
  fromTo,
}: NotificationContentProps) {
  const notification = trpc.notifications.getNotificationById.useQuery(
    { notificationId, updateViewDate: true },
    { enabled: isCUID(notificationId) }
  );
  const { t } = useTranslation("auth");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <span>
          {fromTo === "from"
            ? t("notification.from-user")
            : t("notification.to-user")}
        </span>
        <div className="avatar">
          <div className="w-16 rounded">
            <img
              src={
                (fromTo === "to"
                  ? notification.data?.userFrom.imageUrl
                  : notification.data?.userTo.imageUrl) ?? "/images/dummy.jpg"
              }
              alt={
                (fromTo === "to"
                  ? notification.data?.userFrom.name
                  : notification.data?.userTo.name) ?? ""
              }
            />
          </div>
        </div>
        <span className="text-lg font-bold text-secondary">
          {(fromTo === "to"
            ? notification.data?.userFrom.name
            : notification.data?.userTo.name) ?? ""}
        </span>
      </div>
      <div className="flex items-center gap-4">
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
        {notification.data ? (
          <NotificationMessage
            notification={notification.data}
            fromTo={fromTo}
          />
        ) : null}
      </div>
    </div>
  );
}
type NotificationMessageProps = {
  fromTo: FromTo;
  notification: GetNotificationByIdReturn;
};

function NotificationMessage({
  notification,
  fromTo,
}: NotificationMessageProps) {
  const utils = trpc.useContext();
  const { t } = useTranslation("auth");
  const { getName } = useNotificationType();
  if (!notification) return null;

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
      if (notification)
        utils.notifications.getNotificationById.invalidate({
          notificationId: notification.id,
        });
    }
  }
  const Elem: JSX.Element[] = [];
  Elem.push(
    <div className="badge-info badge">
      {t("notification.notification-type", {
        type: getName(notification.type),
      })}
    </div>
  );
  Elem.push(<p>{notification.message}</p>);
  if (isDate(notification.answered))
    Elem.push(
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
  if (
    fromTo === "to" &&
    !notification.answered &&
    notification.type === "SEARCH_COACH"
  ) {
    Elem.push(
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
  return (
    <>
      {Elem.map((e, idx) => (
        <Fragment key={idx}>{e}</Fragment>
      ))}
    </>
  );
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
      redirect: {
        permanent: false,
        destination: "/",
      },
      props: {
        userId: "",
      },
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
