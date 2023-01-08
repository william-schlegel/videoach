import { authOptions } from "@auth/[...nextauth]";
import type {
  Activity,
  DayName,
  Planning,
  Room,
  User,
  Site,
} from "@prisma/client";
import { Role, PlanningActivity } from "@prisma/client";
import {
  type InferGetServerSidePropsType,
  type GetServerSidePropsContext,
} from "next";
import { unstable_getServerSession } from "next-auth";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18nConfig from "@root/next-i18next.config.mjs";
import { trpc } from "@trpcclient/trpc";
import { useTranslation } from "next-i18next";
import type { ReactNode } from "react";
import { useRef, useState } from "react";
import Spinner from "@ui/spinner";
import Layout from "@root/src/components/layout";
import {
  CreatePlanning,
  DeletePlanning,
  UpdatePlanning,
} from "@modals/managePlanning";
import dayjs from "dayjs";
import { formatDateLocalized } from "@lib/formatDate";
import { DAYS } from "@modals/manageCalendar";
import {
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useForm } from "react-hook-form";

const HHOUR = "h-12"; // 3rem 48px
const HHOUR_PX = 48;
const LEADINGHOUR = "leading-12";
const START_HOUR = 7;
const NB_HOUR = 15;
const HSITE = "h-[45rem]";

function ClubPlanning({
  userId,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { t } = useTranslation("planning");
  const [clubId, setClubId] = useState("");
  const [planningId, setPlanningId] = useState("");
  const queryClubs = trpc.clubs.getClubsForManager.useQuery(userId, {
    onSuccess(data) {
      if (clubId === "") setClubId(data[0]?.id ?? "");
    },
  });
  const queryPlannings = trpc.plannings.getPlanningsForClub.useQuery(clubId, {
    onSuccess(data) {
      if (planningId === "") setPlanningId(data[0]?.id ?? "");
    },
  });

  return (
    <Layout className="container mx-auto my-2 flex flex-col gap-2">
      <h1 className="flex items-center">
        {t("planning-management")}
        <div className="ml-auto flex items-center gap-2">
          <label>{t("select-club")}</label>
          <select
            className="w-48 min-w-fit"
            value={clubId}
            onChange={(e) => setClubId(e.target.value)}
          >
            {queryClubs.data?.map((club) => (
              <option key={club.id} value={club.id}>
                {club.name}
              </option>
            ))}
          </select>
        </div>
      </h1>
      <div className="flex gap-4">
        <aside className="flex min-w-fit max-w-xs flex-grow flex-col gap-2">
          <h4>{t("plannings")}</h4>
          <CreatePlanning clubId={clubId} />
          <ul className="menu overflow-hidden rounded border border-secondary bg-base-100">
            {queryPlannings.data?.map((planning) => (
              <li key={planning.id}>
                <div
                  className={`flex ${
                    planningId === planning.id ? "active" : ""
                  }`}
                >
                  <button
                    onClick={() => setPlanningId(planning.id)}
                    className="flex flex-1 items-center justify-between"
                  >
                    <PlanningName planning={planning} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </aside>
        {planningId ? (
          <PlanningContent
            clubId={clubId}
            planningId={planningId}
            userId={userId}
          />
        ) : null}
      </div>
    </Layout>
  );
}

export default ClubPlanning;

function PlanningName({ planning }: { planning: Planning }) {
  const { t } = useTranslation("planning");
  return (
    <div className="flex w-full items-center justify-between gap-2">
      {planning.name ? <span>{planning.name}</span> : null}
      <span
        className={`${
          planning.name ? "badge-secondary badge" : ""
        } flex items-center gap-1`}
      >
        {!planning.name && <span>{t("from")}</span>}
        {formatDateLocalized(planning.startDate)}
        {dayjs(planning.endDate).isValid() ? (
          <>
            <i className="bx bx-right-arrow-alt bx-xs" />
            <span>{formatDateLocalized(planning.endDate)}</span>
          </>
        ) : null}
      </span>
    </div>
  );
}

type PlanningContentProps = {
  planningId: string;
  clubId: string;
  userId: string;
};

type DropData = {
  day: DayName;
  dayName: string;
  siteName: string;
  activityId: string;
  activityName: string;
  siteId: string;
  rooms: Room[];
};

type DropFormData = {
  startTime: string;
  duration: number;
  roomId: string;
  coachId: string;
};

const PlanningContent = ({
  planningId,
  clubId,
  userId,
}: PlanningContentProps) => {
  const queryPlanning = trpc.plannings.getPlanningById.useQuery(planningId);
  const { t } = useTranslation("planning");
  const queryClub = trpc.clubs.getClubById.useQuery(clubId);
  const queryActivities = trpc.activities.getActivitiesForClub.useQuery({
    clubId,
    userId,
  });
  const refModalDrop = useRef<HTMLInputElement>(null);
  const [dropData, setDropData] = useState<DropData>({
    day: "MONDAY",
    dayName: "",
    siteName: "",
    activityId: "",
    activityName: "",
    siteId: "",
    rooms: [],
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  );
  const utils = trpc.useContext();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<DropFormData>();
  const queryCoachs = trpc.coachs.getCoachsForClub.useQuery(clubId);
  const addActivity = trpc.plannings.addPlanningActivity.useMutation({
    onSuccess() {
      utils.plannings.getPlanningById.invalidate(planningId);
    },
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    const overDay = DAYS.find((d) => d.value === over?.data.current?.day);
    const dayName = overDay?.label ? t(`calendar:${overDay.label}`) : "?";
    const siteId = over?.data.current?.site;
    const site = queryClub.data?.sites.find((s) => s.id === siteId);
    const siteName = site?.name ?? "?";
    const activityName =
      queryActivities.data?.activities.find((a) => a.id === active.id)?.name ??
      "?";
    const rooms = site?.rooms ?? [];
    reset();
    setDropData({
      day: overDay?.value ?? "MONDAY",
      dayName,
      siteName,
      activityName,
      siteId,
      rooms,
      activityId: active.id as string,
    });
    if (refModalDrop.current) refModalDrop.current.checked = true;
  }

  function handleSaveActivity(data: DropFormData) {
    addActivity.mutate({
      planningId,
      siteId: dropData.siteId,
      activityId: dropData.activityId,
      day: dropData.day,
      ...data,
    });
    if (refModalDrop.current) refModalDrop.current.checked = false;
  }

  if (queryPlanning.isLoading) return <Spinner />;
  return (
    <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
      {/* add activity modal */}
      <input
        type="checkbox"
        id="modal-drop"
        className="modal-toggle"
        ref={refModalDrop}
      />
      <div className="modal">
        <form
          onSubmit={handleSubmit(handleSaveActivity)}
          className="modal-box relative"
        >
          <label
            htmlFor="modal-drop"
            className="btn btn-secondary btn-sm btn-circle absolute right-2 top-2"
          >
            <i className="bx bx-x bx-sm" />
          </label>
          <h3 className="text-lg font-bold">{t("new-course")}</h3>
          <h2 className="flex items-center gap-4">
            {t("day")}
            <span className="text-secondary">{dropData.dayName}</span>
          </h2>
          <div className="flex items-center gap-4">
            <label>{t("site")}</label>
            <span>{dropData.siteName}</span>
            <label>{t("activity")}</label>
            <span>{dropData.activityName}</span>
          </div>
          <div className="grid grid-cols-[auto_1fr] gap-2">
            <label className="required">{t("start-hour")}</label>
            <div className="flex flex-col gap-2">
              <input
                type="time"
                {...register("startTime", {
                  required: t("start-hour-mandatory"),
                })}
                className="input-bordered input w-fit self-start"
              />
              {errors.startTime && (
                <p className="text-sm text-error">{errors.startTime.message}</p>
              )}
            </div>
            <label className="required">{t("duration")}</label>
            <div className="flex flex-col gap-2">
              <div className="form-control">
                <div className="input-group">
                  <input
                    type="number"
                    {...register("duration", {
                      valueAsNumber: true,
                      validate: (v) => Number(v) > 1,
                      required: t("duration-mandatory"),
                    })}
                    className="input-bordered input w-full"
                  />
                  <span>{t("minutes")}</span>
                </div>
              </div>
              {errors.duration && (
                <p className="text-sm text-error">{errors.duration.message}</p>
              )}
            </div>
            <label>{t("coach")}</label>
            <select className="w-full" {...register("coachId")}>
              {queryCoachs.data?.map((coach) => (
                <option key={coach.id} value={coach.id}>
                  {coach.name}
                </option>
              ))}
            </select>
            <label>{t("room")}</label>
            <select className="w-full" {...register("roomId")}>
              {dropData.rooms?.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          </div>
          <div className="modal-action">
            <label htmlFor="modal-drop">
              <button className="btn btn-primary">{t("validation")}</button>
            </label>
          </div>
        </form>
      </div>
      {/* planning content */}
      <article className="flex flex-grow flex-col gap-4">
        <section className="flex items-center justify-between">
          <h2>
            {queryPlanning.data ? (
              <PlanningName planning={queryPlanning.data} />
            ) : (
              "-"
            )}
          </h2>
          <div className="flex items-center gap-2">
            <UpdatePlanning clubId={clubId} planningId={planningId} />
            <UpdatePlanning clubId={clubId} planningId={planningId} duplicate />
            <DeletePlanning clubId={clubId} planningId={planningId} />
          </div>
        </section>
        <section className="grid grid-cols-[auto_1fr] gap-2">
          <aside className="flex flex-col gap-1 border border-secondary">
            <span className="bg-secondary px-4 text-center text-secondary-content">
              {t("activities")}
            </span>
            {queryActivities.data?.activities.map((activity) => (
              <DraggableActivity
                key={activity.id}
                id={activity.id}
                name={activity.name}
              />
            ))}
          </aside>

          <div className="grid grid-cols-[auto_1fr]">
            <div>
              <div className="h-12"></div>
              <div>
                <div className="flex w-10 shrink-0 flex-col overflow-y-auto border-r border-base-200 bg-base-100 text-center">
                  {Array.from(
                    { length: NB_HOUR },
                    (_, k) => k + START_HOUR
                  ).map((hour) => (
                    <p
                      key={hour}
                      className={`${HHOUR} border-b border-base-200 text-xs ${LEADINGHOUR} text-base-300`}
                    >
                      {`0${hour}`.slice(-2)}:00
                    </p>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex max-w-full gap-[1px] overflow-auto">
              {DAYS.map((day) => (
                <div key={day.value} className="shrink-0">
                  <div className="w-max-fit flex flex-shrink-0 flex-col">
                    <span className="h-6 bg-primary text-center leading-6 text-primary-content">
                      {t(`calendar:${day.label}`)}
                    </span>
                    <div
                      className={`grid gap-[1px]`}
                      style={{
                        gridTemplateColumns: `repeat(${
                          queryClub.data?.sites.length ?? 1
                        }, minmax(0, 1fr)`,
                      }}
                    >
                      {queryClub.data?.sites.map((site) => (
                        <div key={site.id}>
                          <div className="h-6 max-w-[8em] shrink-0 overflow-hidden text-ellipsis whitespace-nowrap bg-secondary px-2 text-center leading-6 text-secondary-content">
                            {site.name}
                          </div>
                          <DropSite
                            key={site.id}
                            id={`${day.value} ${site.id}`}
                            data={{ day: day.value, site: site.id }}
                          >
                            {queryPlanning.data?.planningActivities
                              .filter(
                                (pa) =>
                                  pa.day === day.value && pa.siteId === site.id
                              )
                              .map((activity) => (
                                <PlanningActivity
                                  key={activity.id}
                                  planningActivity={activity}
                                />
                              ))}
                          </DropSite>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </article>
    </DndContext>
  );
};

type PlanningActivityProps = {
  planningActivity: PlanningActivity & {
    site: Site | null;
    room: Room | null;
    activity: Activity;
    coach: User | null;
  };
};

function PlanningActivity({ planningActivity }: PlanningActivityProps) {
  const hm = planningActivity.startTime.split(":");
  const top = HHOUR_PX * (Number(hm[0]) - START_HOUR + Number(hm[1]) / 60);
  const height = HHOUR_PX * (planningActivity.duration / 60);

  return (
    <div
      className="absolute left-0 flex w-full items-center justify-center bg-secondary"
      style={{ top, height }}
    >
      <span className="text-sm">
        {planningActivity.activity.name} ({planningActivity.duration}
        {"'"})
      </span>
    </div>
  );
}

function DraggableActivity({ id, name }: { id: string; name: string }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });
  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="pill z-10 mx-2 justify-center bg-base-100"
    >
      {name}
    </button>
  );
}

type DropSiteProps = {
  id: string;
  data: {
    day: string;
    site: string;
  };
  children: ReactNode;
};

function DropSite({ id, data, children }: DropSiteProps) {
  const { setNodeRef, isOver } = useDroppable({ id, data });
  return (
    <div
      ref={setNodeRef}
      className={`relative ${HSITE} ${isOver ? "bg-base-200" : "bg-base-100"}`}
    >
      {children}
    </div>
  );
}

export const getServerSideProps = async ({
  locale,
  req,
  res,
}: GetServerSidePropsContext) => {
  const session = await unstable_getServerSession(req, res, authOptions);
  if (
    session?.user?.role !== Role.MANAGER &&
    session?.user?.role !== Role.MANAGER_COACH &&
    session?.user?.role !== Role.ADMIN
  )
    return {
      redirect: "/",
      permanent: false,
    };

  return {
    props: {
      ...(await serverSideTranslations(
        locale ?? "fr",
        ["common", "planning", "calendar"],
        nextI18nConfig
      )),
      userId: session?.user?.id || "",
    },
  };
};
