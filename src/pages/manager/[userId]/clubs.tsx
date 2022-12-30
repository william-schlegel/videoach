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
  type Data,
  useSensor,
  PointerSensor,
  useSensors,
} from "@dnd-kit/core";
import CollapsableGroup from "@ui/collapsableGroup";

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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  );

  function handleDragEnd(e: DragEndEvent) {
    const roomId = e.over?.id.toString();
    const activityId = e.active.data.current?.activityId;
    const actualRoom = e.active.data.current?.roomId;
    if (actualRoom === roomId) return;
    if (actualRoom && actualRoom !== roomId && activityId)
      removeActivity.mutate({ activityId, roomId: actualRoom });
    if (roomId && activityId) addActivity.mutate({ activityId, roomId });
  }

  function handledeleteActivity(roomId: string, activityId: string) {
    console.log("remove activity { activityId, roomId }", {
      activityId,
      roomId,
    });
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
      <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 rounded border border-primary p-4 ">
            <div className="flex flex-row items-center justify-between gap-4">
              <h3>
                {t("site", { count: clubQuery?.data?.sites?.length ?? 0 })}
              </h3>
              <Link
                className="btn-secondary btn"
                href={`${path}${clubId}/sites`}
              >
                {t("manage-sites")}
              </Link>
            </div>
            {clubQuery?.data?.sites?.map((site) => (
              <div key={site.id} className="my-2 flex items-center gap-4">
                <span>{site.address}</span>
                <div className="pill">
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
            <div className="mb-4 flex flex-row items-center justify-between gap-4">
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
            <div className="flex flex-1 flex-wrap gap-2">
              {groups.map((gp) => (
                <CollapsableGroup key={gp.id} groupName={gp.name}>
                  {clubQuery.data?.activities
                    ?.filter((a) => a.groupId === gp.id)
                    ?.map((a) => (
                      <DraggableElement
                        key={a.id}
                        elementId={a.id}
                        data={{ activityId: a.id, roomId: "" }}
                      >
                        {a.name}
                      </DraggableElement>
                    ))}
                </CollapsableGroup>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 rounded border border-primary p-4">
          <h3>{t("manage-club-activities")}</h3>
          <div className="flex flex-col gap-2">
            {clubQuery.data?.sites?.map((site) => (
              <div
                key={site.id}
                className="collapse-arrow rounded-box collapse border border-secondary bg-base-100"
              >
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
                        <DraggableElement
                          key={a.id}
                          elementId={`${a.id} ${room.id}`}
                          data={{ activityId: a.id, roomId: room.id }}
                        >
                          {a.name}
                          <div
                            className="tooltip flex items-center"
                            data-tip={t("remove-activity")}
                          >
                            <i
                              className="bx bx-x bx-sm cursor-pointer rounded-full bg-base-100 text-secondary hover:bg-secondary hover:text-secondary-content"
                              onClick={(e) => {
                                e.stopPropagation();
                                handledeleteActivity(room.id, a.id);
                              }}
                            />
                          </div>
                        </DraggableElement>
                      ))}
                    </DroppableArea>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DndContext>
    </div>
  );
}

type DroppableAreaProps = {
  areaId: string;
  title: string;
  children?: ReactNode;
};

function DroppableArea({ areaId, title, children }: DroppableAreaProps) {
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
  data: Data<{ activityId: string; roomId: string }>;
  children: ReactNode;
};

function DraggableElement({
  elementId,
  children,
  data,
}: DraggableElementProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: elementId,
    data,
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      className={`z-50 ${
        transform ? "cursor-grabbing" : "cursor-grab"
      } flex items-center gap-2 rounded-full border border-neutral bg-base-100 px-4 py-1`}
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
