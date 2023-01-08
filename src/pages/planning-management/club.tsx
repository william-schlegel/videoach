import { authOptions } from "@auth/[...nextauth]";
import type { Planning, RoomReservation } from "@prisma/client";
import { Role } from "@prisma/client";
import {
  type InferGetServerSidePropsType,
  type GetServerSidePropsContext,
} from "next";
import { unstable_getServerSession } from "next-auth";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18nConfig from "@root/next-i18next.config.mjs";
import { trpc } from "@trpcclient/trpc";
import { useTranslation } from "next-i18next";
import { useRef, useState } from "react";
import Spinner from "@ui/spinner";
import Layout from "@root/src/components/layout";
import Link from "next/link";
import { toast } from "react-toastify";
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
  day?: string;
  site?: string;
  activity?: string;
};

type DropFormData = {
  startHour: string;
  duration: number;
  roomId: string;
  coachId: string;
  reservation: RoomReservation;
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
  const [dropData, setDropData] = useState<DropData>({});

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  );
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<DropFormData>();

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    const overDay = DAYS.find(
      (d) => d.value === over?.data.current?.day
    )?.label;
    const day = overDay ? t(`calendar:${overDay}`) : "?";
    const site =
      queryClub.data?.sites.find((s) => s.id === over?.data.current?.site)
        ?.name ?? "?";
    const activity =
      queryActivities.data?.activities.find((a) => a.id === active.id)?.name ??
      "?";
    reset();
    setDropData({
      day,
      site,
      activity,
    });
    if (refModalDrop.current) refModalDrop.current.checked = true;
  }

  function handleSaveActivity(data: DropFormData) {
    console.log("save :>> ", { data });
  }

  if (errors) console.log("errors :>> ", errors);

  if (queryPlanning.isLoading) return <Spinner />;
  return (
    <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
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
            <span className="text-secondary">{dropData.day}</span>
          </h2>
          <div className="flex items-center gap-4">
            <label>{t("site")}</label>
            <span>{dropData.site}</span>
            <label>{t("activity")}</label>
            <span>{dropData.activity}</span>
          </div>
          <div className="grid grid-cols-[auto_1fr] gap-2">
            <label className="required">{t("start-hour")}</label>
            <div className="flex flex-col gap-2">
              <input
                type="time"
                {...register("startHour", {
                  required: t("start-hour-mandatory"),
                })}
                className="input-bordered input w-fit self-end"
              />
              {errors.startHour && (
                <p className="text-sm text-error">{errors.startHour.message}</p>
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
          </div>
          <div className="modal-action">
            <label htmlFor="modal-drop">
              <button className="btn btn-primary">{t("validation")}</button>
            </label>
          </div>
        </form>
      </div>
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
              <Activity
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
                <div className="flex max-h-[70vh] w-10 shrink-0 flex-col overflow-y-auto border-r border-base-200 bg-base-100 text-center">
                  {Array.from({ length: 24 }, (_, k) => k).map((hour) => (
                    <p
                      key={hour}
                      className="h-6 border-b border-base-200 text-xs leading-6 text-base-300"
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
                          <Site
                            key={site.id}
                            id={`${day.value} ${site.id}`}
                            data={{ day: day.value, site: site.id }}
                          />
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

function Activity({ id, name }: { id: string; name: string }) {
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

type SiteProps = {
  id: string;
  data: {
    day: string;
    site: string;
  };
};

function Site({ id, data }: SiteProps) {
  const { setNodeRef, isOver } = useDroppable({ id, data });
  return (
    <div
      ref={setNodeRef}
      className={`h-[36rem] ${isOver ? "bg-base-200" : "bg-base-100"}`} // 24 * h-6 = 1.5rem
    >
      &nbsp;
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
