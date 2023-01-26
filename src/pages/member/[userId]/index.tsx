import { authOptions } from "@auth/[...nextauth]";
import { isCUID } from "@lib/checkValidity";
import { formatDateLocalized } from "@lib/formatDate";
import { useDayName } from "@lib/useDayName";
import type {
  Activity,
  ActivityGroup,
  Club,
  DayOpeningTime,
  OpeningTime,
  PlanningActivity,
  Reservation,
  Room,
  RoomReservation,
  Site,
  UserCoach,
} from "@prisma/client";
import { Role, Subscription } from "@prisma/client";
import nextI18nConfig from "@root/next-i18next.config.mjs";
import Layout from "@root/src/components/layout";
import { trpc } from "@trpcclient/trpc";
import Confirmation from "@ui/confirmation";
import Modal from "@ui/modal";
import { SelectDate } from "@ui/selectDay";
import Spinner from "@ui/spinner";
import {
  add,
  format,
  getHours,
  getMinutes,
  isBefore,
  isEqual,
  startOfDay,
  startOfToday,
} from "date-fns";
import {
  type GetServerSidePropsContext,
  type InferGetServerSidePropsType,
} from "next";
import { unstable_getServerSession } from "next-auth";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Link from "next/link";
import { useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { useDisplaySubscriptionInfo } from "../../manager/[userId]/[clubId]/subscription";

/***
 *
 *  Member dashboard
 *
 */

const MemberDashboard = ({
  userId,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const { t } = useTranslation("dashboard");
  const queryUser = trpc.users.getUserSubscriptionsById.useQuery(userId);
  const [day, setDay] = useState(startOfToday());
  const queryReservations = trpc.users.getReservationsByUserId.useQuery({
    userId,
    after: startOfToday(),
  });

  return (
    <Layout className="container mx-auto my-2 flex flex-col gap-2">
      <h1 className="flex justify-between">
        {t("member.dashboard")}
        <Link
          className="btn-secondary btn"
          href={`/member/${userId}/subscribe`}
        >
          {t("member.new-subscription")}
        </Link>
      </h1>
      <h2>
        {t("member.my-subscription", {
          count: queryUser.data?.memberData?.subscriptions.length ?? 0,
        })}
      </h2>
      <section className="mb-4 grid grid-flow-col gap-4">
        {queryUser.data?.memberData?.subscriptions.map((sub) => (
          <Subscription key={sub.id} subscription={sub} />
        ))}
      </section>
      <section className="grid grid-cols-2 gap-2">
        <article className="rounded-md border border-primary p-2">
          <div className="flex items-center justify-between">
            <h2>{t("member.my-planning")}</h2>
            <SelectDate day={day} onNewDay={(newDay) => setDay(newDay)} />
          </div>
          <DailyPlanning day={day} memberId={userId} />
        </article>
        <article className="rounded-md border border-primary p-2">
          <h2>{t("member.my-reservations")}</h2>
          <div className="flex flex-wrap gap-2">
            {queryReservations.data?.map((reservation) => (
              <MyReservation
                key={reservation.id}
                reservation={reservation}
                memberId={userId}
                day={day}
              />
            ))}
          </div>
        </article>
      </section>
    </Layout>
  );
};

export default MemberDashboard;

type MyReservationProps = {
  memberId: string;
  day: Date;
  reservation: Reservation & {
    room: Room | null;
    activity: Activity | null;
    planningActivity:
      | (PlanningActivity & {
          activity: Activity;
          coach: UserCoach | null;
          room: Room | null;
        })
      | null;
  };
};

function MyReservation({ reservation, memberId, day }: MyReservationProps) {
  const { t } = useTranslation("dashboard");
  const utils = trpc.useContext();
  const deleteReservation = trpc.plannings.deleteReservation.useMutation({
    onSuccess() {
      utils.users.getReservationsByUserId.invalidate({
        userId: memberId,
        after: day,
      });
      utils.plannings.getMemberDailyPlanning.invalidate({
        memberId,
        date: day,
      });
    },
  });

  function handleDeleteReservation() {
    deleteReservation.mutate(reservation.id);
  }

  return (
    <div className="rounded border border-primary bg-base-100">
      <div className="flex items-center justify-between gap-4 bg-primary px-3 py-1 text-center text-primary-content">
        <span>{formatDateLocalized(reservation.date, { withDay: true })}</span>
        <Confirmation
          message={t("member.reservation-delete-message")}
          title={t("member.delete-reservation")}
          buttonIcon={<i className="bx bx-trash bx-xs" />}
          onConfirm={() => handleDeleteReservation()}
          buttonSize="xs"
          variant="Icon-Only-Secondary"
        />
      </div>
      {reservation?.planningActivity ? (
        <div className="p-2">
          <div className="space-x-2 text-center">
            <span className="font-semibold">
              {reservation.planningActivity?.activity?.name}
            </span>
            {reservation.planningActivity?.coach?.publicName ? (
              <span className="text-xs">
                {"("}
                {reservation.planningActivity?.coach?.publicName}
                {")"}
              </span>
            ) : null}
          </div>
          <div className="flex justify-between">
            <span>{reservation.planningActivity?.startTime}</span>
            <span>{reservation.planningActivity?.room?.name}</span>
          </div>
        </div>
      ) : null}
      {reservation?.activity ? (
        <div className="p-2">
          <div className="space-x-2 text-center">
            <span className="font-semibold">{reservation.activity?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="space-x-2">
              <span>{format(reservation?.date, "hh:mm")}</span>
              <span className="text-xs">
                {"("}
                {reservation.duration}
                {"')"}
              </span>
            </span>
            <span>{reservation.room?.name}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

type DailyPlanningProps = {
  memberId: string;
  day: Date;
};

function DailyPlanning({ memberId, day }: DailyPlanningProps) {
  const { t } = useTranslation("dashboard");
  const planning = trpc.plannings.getMemberDailyPlanning.useQuery({
    date: day,
    memberId,
  });
  if (planning.isInitialLoading) return <Spinner />;
  if (!planning.data) return <div>{t("member.no-planning")}</div>;
  return (
    <div className="flex flex-col gap-2">
      {planning.data.map((plan) => (
        <div
          key={plan.id}
          className="flex flex-col items-center rounded border border-secondary bg-base-100"
        >
          <div className="w-full  bg-secondary text-center text-secondary-content">
            {plan.club.name}
          </div>
          <div className="flex shrink-0 flex-wrap items-start gap-2 p-2">
            {plan.activities.map((activity) => (
              <div
                key={activity.id}
                className="border border-base-300 bg-base-100 p-2"
              >
                <p>
                  <span className="text-xs">{activity.startTime}</span>
                  {" ("}
                  <span className="text-xs">{activity.duration}</span>
                  {"') "}
                  <span>{activity.activity.name}</span>
                </p>
                <p className="text-xs">
                  <span>{activity.site?.name}</span>
                  {" - "}
                  <span>{activity.room?.name}</span>
                </p>
                <MakeReservation
                  room={activity.room}
                  reservations={activity.reservations}
                  memberId={memberId}
                  planningActivityId={activity.id}
                  day={day}
                />
              </div>
            ))}
            {plan.withNoCalendar.map((activity) => (
              <Wnc
                key={activity.id}
                activity={activity}
                day={day}
                memberId={memberId}
                reservations={activity.reservations}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

type MakeReservationProps = {
  room: Room | null;
  reservations: { id: string; date: Date }[];
  planningActivityId: string;
  memberId: string;
  day: Date;
};
function MakeReservation({
  room,
  reservations,
  planningActivityId,
  memberId,
  day,
}: MakeReservationProps) {
  const { t } = useTranslation("dashboard");
  const utils = trpc.useContext();
  const createReservation =
    trpc.plannings.createPlanningReservation.useMutation({
      onSuccess() {
        utils.users.getReservationsByUserId.invalidate({
          userId: memberId,
          after: day,
        });
        utils.plannings.getMemberDailyPlanning.invalidate({
          memberId,
          date: day,
        });
      },
    });

  if (!room) return null;
  if (isBefore(day, startOfToday())) return null;

  const free =
    room.capacity > reservations.length
      ? room.capacity - reservations.length
      : 0;
  if (room.reservation === "NONE")
    return (
      <div className="text-center">
        <p className="btn-outline btn-disabled btn-xs btn">
          {t("member.free-access")}
        </p>
      </div>
    );

  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs">
        {free
          ? t("member.remain", { free, capacity: room.capacity })
          : t("member.waiting-list")}
      </p>
      {reservations.find(
        (r) => r.id === planningActivityId && isEqual(day, r.date)
      ) ? (
        <span className="btn-accent btn-xs btn">{t("member.reserved")}</span>
      ) : (
        <button
          className="btn-primary btn-xs btn"
          onClick={() =>
            createReservation.mutate({
              planningActivityId,
              memberId,
              date: day,
            })
          }
        >
          {t("member.reserve")}
        </button>
      )}
    </div>
  );
}

type WncRoom = {
  id: string;
  name: string;
  capacity: number;
  reservation: RoomReservation;
};

type WncProps = {
  activity: Activity & {
    rooms: WncRoom[];
  };
  day: Date;
  memberId: string;
  reservations: { id: string; date: Date }[];
};

function Wnc({ activity, day, memberId, reservations }: WncProps) {
  const { t } = useTranslation("dashboard");
  const { getDayForDate } = useDayName();
  const dayName = getDayForDate(day);
  // console.log("memberId", memberId);
  // const calRoom = trpc.calendars.getCalendarForRoom.useQuery(
  //   {
  //     clubId: activity.clubId,
  //     siteId: activity.siteId ?? "",
  //     roomId: activity.roomId ?? "",
  //   },
  //   { enabled: isCUID(activity.roomId) && isCUID(activity.siteId) }
  // );
  // const calSite = trpc.calendars.getCalendarForSite.useQuery(
  //   {
  //     clubId: activity.clubId,
  //     siteId: activity.siteId ?? "",
  //   },
  //   { enabled: isCUID(activity.siteId) }
  // );
  const calClub = trpc.calendars.getCalendarForClub.useQuery(
    activity.clubId,

    { enabled: isCUID(activity.clubId) }
  );

  let openingText = "";
  let OT:
    | (DayOpeningTime & {
        workingHours: OpeningTime[];
      })
    | null = null;
  // if (calRoom.data)
  //   OT = calRoom.data.openingTime.find((d) => d.name === dayName) ?? null;
  // else if (calSite.data)
  //   OT = calSite.data.openingTime.find((d) => d.name === dayName) ?? null;
  // else if (calClub.data)
  if (calClub.data)
    OT = calClub.data.openingTime.find((d) => d.name === dayName) ?? null;

  if (OT?.wholeDay) openingText = t("member.all-day");
  else if (OT?.closed) openingText = t("member.closed");
  else {
    openingText =
      OT?.workingHours.map((wh) => `${wh.opening}-${wh.closing}`).join(" | ") ??
      "";
  }

  return (
    <>
      {activity.rooms.map((room) => (
        <div
          key={`${room?.name}-${activity.id}`}
          className="border border-base-300 bg-base-100 p-2"
        >
          <p>
            <span className="text-xs">{openingText}</span>&nbsp;
            <span>{activity.name}</span>
          </p>
          <p className="text-xs">
            {room?.name ? <span>{room.name}</span> : null}
          </p>
          <ReserveDuration
            activity={activity}
            room={room}
            reservations={reservations}
            day={day}
            memberId={memberId}
          />
        </div>
      ))}
    </>
  );
}

type ReserveDurationProps = {
  activity: Activity;
  room: WncRoom;
  reservations: { id: string; date: Date }[];
  day: Date;
  memberId: string;
};

type ReserveDurationFormValues = {
  time: Date;
  duration: number;
};

function ReserveDuration({
  room,
  activity,
  reservations,
  day,
  memberId,
}: ReserveDurationProps) {
  const { t } = useTranslation("dashboard");
  const { register, handleSubmit } = useForm<ReserveDurationFormValues>({
    defaultValues: { duration: Math.min(60, activity.maxDuration) },
  });
  const utils = trpc.useContext();
  const createReservation =
    trpc.plannings.createActivityReservation.useMutation({
      onSuccess() {
        utils.users.getReservationsByUserId.invalidate({
          userId: memberId,
          after: day,
        });
        utils.plannings.getMemberDailyPlanning.invalidate({
          memberId,
          date: day,
        });
      },
    });

  if (isBefore(day, startOfToday())) return null;

  const onSubmit: SubmitHandler<ReserveDurationFormValues> = (data) => {
    const date = add(startOfDay(day), {
      hours: getHours(data.time),
      minutes: getMinutes(data.time),
    });
    console.log("date", date);
    createReservation.mutate({
      date,
      memberId,
      activityId: activity.id,
      roomId: room.id,
      duration: data.duration,
    });
  };

  if (room?.reservation === "NONE")
    return (
      <div className="text-center">
        <p className="btn-outline btn-disabled btn-xs btn">
          {t("member.free-access")}
        </p>
      </div>
    );
  const free =
    room.capacity > reservations.length
      ? room.capacity - reservations.length
      : 0;

  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs">
        {free
          ? t("member.remain", { free, capacity: room.capacity })
          : t("member.waiting-list")}
      </p>
      {reservations.find(
        (r) => r.id === activity.id && isEqual(day, r.date)
      ) ? (
        <span className="btn-accent btn-xs btn">{t("member.reserved")}</span>
      ) : (
        <Modal
          title={t("member.reserve")}
          variant="Primary"
          buttonSize="xs"
          handleSubmit={handleSubmit(onSubmit)}
        >
          <h3>{t("member.reserve")}</h3>
          <div className="form-control">
            <label>
              {t("club:activity.start-time", { count: activity.maxDuration })}
            </label>
            <input
              type="time"
              {...register("time", { valueAsDate: true })}
              className="input-bordered input w-full"
            />

            <label>
              {t("club:activity.duration", { count: activity.maxDuration })}
            </label>
            <div className="input-group">
              <input
                type="number"
                min={0}
                max={activity.maxDuration}
                {...register("duration", { valueAsNumber: true })}
                className="input-bordered input w-full"
              />
              <span>{t("club:activity.minutes")}</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

type SubscriptionProps = {
  subscription: Subscription & {
    sites: Site[];
    activities: Activity[];
    rooms: Room[];
    activitieGroups: ActivityGroup[];
    club: Club;
  };
};

function Subscription({ subscription }: SubscriptionProps) {
  const { shortInfo, sites, rooms, activityGroups, activities } =
    useDisplaySubscriptionInfo(
      subscription.mode,
      subscription.restriction,
      subscription.activitieGroups.map((ag) => ag.id),
      subscription.activities.map((ag) => ag.id),
      subscription.sites.map((ag) => ag.id),
      subscription.rooms.map((ag) => ag.id)
    );
  return (
    <div className="card w-full max-w-[32rem] bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <h3 className="card-title text-primary">{subscription.name}</h3>
          <span className="badge-primary badge">{subscription.club.name}</span>
        </div>
        {shortInfo ? <p>{shortInfo}</p> : ""}
        <div className="flex gap-2">
          <List label="sites" items={sites} />
          <List label="rooms" items={rooms} />
          <List label="activity-groups" items={activityGroups} />
          <List label="activities" items={activities} />
        </div>
      </div>
    </div>
  );
}

type ListProps = {
  label: string;
  items: string[];
};

function List({ label, items }: ListProps) {
  const { t } = useTranslation("dashboard");
  if (!items.length) return null;
  return (
    <div className="flex flex-1 flex-col">
      <h4>{t(label, { count: items.length })}</h4>
      <ul>
        {items.map((item, idx) => (
          <li key={`ITEM-${idx}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export const getServerSideProps = async ({
  locale,
  req,
  res,
}: GetServerSidePropsContext) => {
  const session = await unstable_getServerSession(req, res, authOptions);
  if (session?.user?.role !== Role.MEMBER && session?.user?.role !== Role.ADMIN)
    return {
      redirect: "/signin",
      permanent: false,
    };

  return {
    props: {
      ...(await serverSideTranslations(
        locale ?? "fr",
        ["common", "dashboard", "club", "calendar"],
        nextI18nConfig
      )),
      userId: session?.user?.id || "",
    },
  };
};
