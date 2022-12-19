import { type ActivityGroup, Role } from "@prisma/client";
import { useSession } from "next-auth/react";
import { type ReactNode, useState } from "react";
import { trpc } from "@trpcclient/trpc";
import { CreateClub, DeleteClub, UpdateClub } from "@modals/manageClub";
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
import AddActivity from "@modals/manageActivity";
import Link from "next/link";
import { useRouter } from "next/router";
import { CreateClubCalendar } from "@modals/manageCalendar";
import CalendarWeek from "@root/src/components/calendarWeek";
import {
  useDroppable,
  useDraggable,
  DndContext,
  type DragEndEvent,
} from "@dnd-kit/core";
import CollapsableGroup from "@ui/collapsableGroup";
import { CgClose } from "react-icons/cg";

const ManageClubs = ({
  userId,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const { data: sessionData } = useSession();
  const clubQuery = trpc.clubs.getClubsForManager.useQuery(userId, {
    onSuccess(data) {
      if (clubId === "") setClubId(data[0]?.id || "");
    },
  });
  const [clubId, setClubId] = useState("");
  const { t } = useTranslation("club");

  if (
    sessionData &&
    ![Role.MANAGER, Role.MANAGER_COACH, Role.ADMIN].includes(
      sessionData.user?.role
    )
  )
    return <div>{t("manager-only")}</div>;

  return (
    <div className="container mx-auto">
      <div className="mb-4 flex flex-row items-center gap-4">
        <h1>{t("manage-my-club", { count: clubQuery.data?.length ?? 0 })}</h1>
        <CreateClub />
      </div>
      <div className="flex gap-4">
        {clubQuery.isLoading ? (
          <Spinner />
        ) : (
          <ul className="menu w-1/4 overflow-hidden rounded bg-base-100">
            {clubQuery.data?.map((club) => (
              <li key={club.id}>
                <button
                  className={`w-full text-center ${
                    clubId === club.id ? "active" : ""
                  }`}
                  onClick={() => setClubId(club.id)}
                >
                  {club.name}
                </button>
              </li>
            ))}
          </ul>
        )}
        {clubId === "" ? null : <ClubContent userId={userId} clubId={clubId} />}
      </div>
    </div>
  );
};

export default ManageClubs;

type ClubContentProps = {
  userId: string;
  clubId: string;
};

export function ClubContent({ userId, clubId }: ClubContentProps) {
  const clubQuery = trpc.clubs.getClubById.useQuery(clubId, {
    onSuccess(data) {
      const groups = new Map();
      for (const act of data?.activities || [])
        groups.set(act.group.id, act.group);
      setGroups(Array.from(groups.values()));
    },
  });
  const calendarQuery = trpc.calendars.getCalendarForClub.useQuery(clubId);
  const addActivity = trpc.activities.affectToRoom.useMutation({
    onSuccess() {
      utils.clubs.getClubById.invalidate(clubId);
    },
  });
  const removeActivity = trpc.activities.removeFromRoom.useMutation({
    onSuccess() {
      utils.clubs.getClubById.invalidate(clubId);
    },
  });
  const [groups, setGroups] = useState<ActivityGroup[]>([]);
  const utils = trpc.useContext();
  const { t } = useTranslation("club");
  const router = useRouter();

  const root = router.asPath.split("/");
  root.pop();
  const path = root.reduce((a, r) => a.concat(`${r}/`), "");

  function handleDragEnd(e: DragEndEvent) {
    const roomId = e.over?.id.toString();
    const activityId = e.active.id.toString();
    if (roomId && activityId) addActivity.mutate({ activityId, roomId });
  }

  function handledeleteActivity(roomId: string, activityId: string) {
    removeActivity.mutate({ activityId, roomId });
  }

  if (clubQuery.isLoading) return <Spinner />;
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2>{clubQuery.data?.name}</h2>
          <p>({clubQuery.data?.address})</p>
        </div>
        <div className="flex items-center gap-2">
          <UpdateClub clubId={clubId} />
          <CreateClubCalendar clubId={clubId} />
          <DeleteClub clubId={clubId} />
        </div>
      </div>
      <CalendarWeek
        calendar={calendarQuery.data}
        isLoading={calendarQuery.isLoading}
      />
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 rounded border border-primary p-4 ">
          <div className="flex flex-row items-center gap-4">
            <h3>{t("site", { count: clubQuery?.data?.sites?.length ?? 0 })}</h3>
            <Link className="btn-secondary btn" href={`${path}${clubId}/sites`}>
              {t("manage-sites")}
            </Link>
          </div>
          {clubQuery?.data?.sites?.map((site) => (
            <div key={site.id} className="my-2 flex items-center gap-4">
              <span>{site.address}</span>
              <div className="rounded-full border border-neutral bg-base-100 px-4 py-2 text-neutral">
                {site.rooms.length > 0 && (
                  <span className="mr-2 text-lg text-primary">
                    {site.rooms.length}
                  </span>
                )}
                {t("room", { count: site.rooms.length })}
              </div>
            </div>
          ))}
        </div>
        <div className="flex-1 rounded border border-primary p-4 ">
          <div className="mb-4 flex flex-row items-center gap-4">
            <h3>
              {t("activity", {
                count: clubQuery?.data?.activities.length ?? 0,
              })}
            </h3>
            <AddActivity
              clubId={clubId}
              userId={userId}
              onSuccess={() => {
                utils.clubs.getClubById.invalidate(clubId);
              }}
              withAdd
              withUpdate
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {clubQuery?.data?.activities?.map((activity) => (
              <span
                key={activity.id}
                className="rounded-full border border-neutral bg-base-100 px-4 py-2 text-neutral"
              >
                {activity.name}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2 rounded border border-primary p-4">
        <DndContext onDragEnd={handleDragEnd}>
          <h3>{t("manage-club-activities")}</h3>
          <div className="flex flex-1 flex-wrap gap-2">
            {groups.map((gp) => (
              <CollapsableGroup key={gp.id} groupName={gp.name}>
                {clubQuery.data?.activities
                  ?.filter((a) => a.groupId === gp.id)
                  ?.map((a) => (
                    <DraggableElement key={a.id} elementId={a.id}>
                      {a.name}
                    </DraggableElement>
                  ))}
              </CollapsableGroup>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            {clubQuery.data?.sites?.map((site) => (
              <div key={site.id} className="collapse-arrow collapse">
                <input type="checkbox" defaultChecked={true} />
                <h4 className="collapse-title">{site.name}</h4>
                <div className="collapse-content">
                  {site.rooms?.map((room) => (
                    <DroppableArea
                      key={room.id}
                      areaId={room.id}
                      title={room.name}
                    >
                      {room.activities?.map((a) => (
                        <span
                          key={a.id}
                          className="z-10 flex items-center gap-2 rounded-full border border-neutral bg-base-100 px-2 py-1"
                        >
                          {a.name}
                          <div
                            className="tooltip"
                            data-tip={t("remove-activity")}
                          >
                            <CgClose
                              size={16}
                              className="cursor-pointer rounded-full bg-base-100 text-secondary hover:bg-secondary hover:text-secondary-content"
                              onClick={() =>
                                handledeleteActivity(room.id, a.id)
                              }
                            />
                          </div>
                        </span>
                      ))}
                    </DroppableArea>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DndContext>
      </div>
    </div>
  );
}

type DroppableAreaProps = {
  areaId: string;
  title: string;
  children?: ReactNode;
};

function DroppableArea({ areaId, children, title }: DroppableAreaProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: areaId,
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-16 relative m-1 flex flex-wrap items-center gap-2 rounded border border-neutral p-2 ${
        isOver ? "bg-base-300" : "bg-base-100"
      }`}
    >
      <span className="absolute right-4 text-secondary opacity-70">
        {title}
      </span>
      {children}
    </div>
  );
}

type DraggableElementProps = {
  elementId: string;
  children: ReactNode;
};

function DraggableElement({ elementId, children }: DraggableElementProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: elementId,
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      className={`z-50 ${
        transform ? "cursor-grabbing" : "cursor-grab"
      } rounded-full border border-neutral bg-base-100 px-4 py-1`}
      style={style}
      {...listeners}
      {...attributes}
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
        ["common", "club", "calendar"],
        nextI18nConfig
      )),
      userId: session?.user?.id || "",
    },
  };
};
