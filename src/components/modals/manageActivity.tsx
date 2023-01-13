import { trpc } from "../../utils/trpc";
import Modal, { type TModalVariant } from "../ui/modal";
import { useState } from "react";
import Confirmation from "../ui/confirmation";
import { useTranslation } from "next-i18next";
import { type ButtonSize } from "@ui/buttonIcon";
import Spinner from "@ui/spinner";
import { toast } from "react-toastify";
import { isCUID } from "@lib/checkValidity";

type AddActivityProps = {
  userId: string;
  clubId: string;
  withAdd?: boolean;
  withUpdate?: boolean;
  onSuccess: () => void;
};

const AddActivity = ({
  userId,
  clubId,
  onSuccess,
  withAdd = false,
  withUpdate = false,
}: AddActivityProps) => {
  const [groupId, setGroupId] = useState("");
  const queryGroups = trpc.activities.getActivityGroupsForUser.useQuery(
    userId,
    {
      onSuccess(data) {
        if (groupId === "" && data.length > 0) setGroupId(data[0]?.id || "");
      },
    }
  );
  const queryClubActivities = trpc.activities.getActivitiesForClub.useQuery(
    {
      clubId,
      userId,
    },
    {
      enabled: isCUID(clubId) && isCUID(userId),
    }
  );
  const updateClubActivities = trpc.clubs.updateClubActivities.useMutation({
    onSuccess() {
      onSuccess();
    },
  });
  const { t } = useTranslation("club");

  const onSubmit = () => {
    updateClubActivities.mutate({
      id: clubId,
      activities: queryClubActivities.data?.activities.map((a) => a.id) || [],
    });
  };

  return (
    <Modal
      title={t("activity.select-activities")}
      handleSubmit={onSubmit}
      submitButtonText={t("activity.save-activity")}
      buttonIcon={<i className="bx bx-plus bx-xs" />}
      className="w-11/12 max-w-5xl"
    >
      <h3>{t("activity.select-club-activities")}</h3>
      <div className="flex flex-1 gap-4">
        <aside className="flex flex-col gap-2">
          <h4>{t("group.group")}</h4>
          <ul className="menu overflow-hidden rounded border border-secondary bg-base-100">
            {queryGroups.data?.map((group) => (
              <li key={group.id}>
                <div className={`flex ${groupId === group.id ? "active" : ""}`}>
                  <button onClick={() => setGroupId(group.id)}>
                    {group.name}
                  </button>
                  {withUpdate && !group.default && (
                    <>
                      <UpdateGroup groupId={group.id} userId={userId} />
                      <DeleteGroup groupId={group.id} userId={userId} />
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {withAdd ? <NewGroup userId={userId} /> : null}
        </aside>
        <div className="flex flex-grow flex-col gap-2">
          <h4>{t("activity.activities")}</h4>
          <div className="flex flex-wrap gap-2">
            {queryClubActivities.data?.activities
              .filter((a) => a.groupId === groupId)
              .map((activity) => (
                <div key={activity.id} className="flex items-center gap-2">
                  <span className="flex items-center gap-1 rounded-full border border-primary px-4 py-2 text-primary-content">
                    {activity.name}
                    {withUpdate && (
                      <>
                        <UpdateActivity
                          clubId={clubId}
                          groupId={groupId}
                          id={activity.id}
                          initialName={activity.name}
                        />
                        <DeleteActivity
                          clubId={clubId}
                          activityId={activity.id}
                        />
                      </>
                    )}
                  </span>
                </div>
              ))}
          </div>
          {withAdd ? <NewActivity clubId={clubId} groupId={groupId} /> : null}
        </div>
      </div>
    </Modal>
  );
};

export default AddActivity;

type NewActivityProps = {
  clubId: string;
  groupId: string;
};

const NewActivity = ({ clubId, groupId }: NewActivityProps) => {
  const utils = trpc.useContext();
  const groupQuery = trpc.activities.getActivityGroupById.useQuery(groupId, {
    enabled: isCUID(groupId),
  });
  const createActivity = trpc.activities.createActivity.useMutation({
    onSuccess: () => {
      utils.activities.getActivitiesForClub.invalidate();
      toast.success(t("activity.created") as string);
    },
    onError(error) {
      toast.error(error.message);
    },
  });
  const [name, setName] = useState("");
  const [error, setError] = useState(false);
  const { t } = useTranslation("club");

  function addNewActivity() {
    if (name === "") {
      setError(true);
      return;
    }
    setError(false);
    createActivity.mutate({
      name,
      clubId,
      groupId,
    });
  }

  return (
    <Modal title={t("activity.new")} handleSubmit={addNewActivity}>
      <h3>
        {t("activity.create-group")}
        <span className="text-primary">{groupQuery.data?.name}</span>
      </h3>
      <input
        className="input-bordered input w-full"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      {error && <p className="text-sm text-error">{t("name-mandatory")}</p>}
    </Modal>
  );
};

type UpdateActivityProps = {
  clubId: string;
  groupId: string;
  id: string;
  initialName: string;
};

function UpdateActivity({
  clubId,
  groupId,
  id,
  initialName,
}: UpdateActivityProps) {
  const utils = trpc.useContext();
  const updateActivity = trpc.activities.updateActivity.useMutation({
    onSuccess: () => {
      utils.activities.getActivitiesForClub.invalidate();
      toast.success(t("activity.updated") as string);
    },
    onError(error) {
      toast.error(error.message);
    },
  });
  const [name, setName] = useState(initialName);
  const [error, setError] = useState(false);
  const { t } = useTranslation("club");

  function update() {
    if (name === "") {
      setError(true);
      return;
    }
    setError(false);
    updateActivity.mutate({
      id,
      name,
      clubId,
      groupId,
    });
  }

  return (
    <Modal
      title={t("activity.update")}
      handleSubmit={update}
      buttonIcon={<i className="bx bx-edit bx-xs" />}
      variant={"Icon-Outlined-Primary"}
      buttonSize="sm"
    >
      <h3>
        {t("activity.update")}
        <span className="text-primary">{initialName}</span>
      </h3>
      <input
        className="input-bordered input w-full"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      {error && (
        <p className="text-sm text-error">{t("activity-name-mandatory")}</p>
      )}
    </Modal>
  );
}

type DeleteActivityProps = {
  clubId: string;
  activityId: string;
};

function DeleteActivity({ clubId, activityId }: DeleteActivityProps) {
  const utils = trpc.useContext();
  const deleteActivity = trpc.activities.deleteActivity.useMutation({
    onSuccess: () => {
      utils.activities.getActivitiesForClub.invalidate();
      toast.success(t("activity.deleted") as string);
    },
    onError(error) {
      toast.error(error.message);
    },
  });
  const { t } = useTranslation("club");

  return (
    <Confirmation
      title={t("activity.deletion")}
      message={t("activity.deletion-message")}
      onConfirm={() => deleteActivity.mutate({ clubId, activityId })}
      buttonIcon={<i className="bx bx-trash bx-xs" />}
      variant={"Icon-Outlined-Secondary"}
      textConfirmation={t("activity.deletion-confirmation")}
      buttonSize="sm"
    />
  );
}

type NewGroupProps = {
  userId?: string;
  variant?: TModalVariant;
};

export const NewGroup = ({ userId, variant = "Primary" }: NewGroupProps) => {
  const utils = trpc.useContext();
  const createGroup = trpc.activities.createGroup.useMutation({
    onSuccess: () => {
      userId
        ? utils.activities.getActivityGroupsForUser.invalidate(userId)
        : utils.activities.getAllActivityGroups.invalidate(),
        toast.success(t("group.created") as string);
    },
    onError(error) {
      toast.error(error.message);
    },
  });
  const [name, setName] = useState("");
  const [error, setError] = useState(false);
  const { t } = useTranslation("club");

  function addNewGroup() {
    if (name === "") {
      setError(true);
      return;
    }
    setError(false);
    createGroup.mutate({
      name,
      userId,
      default: userId ? false : true,
    });
  }

  return (
    <Modal title={t("group.new")} variant={variant} handleSubmit={addNewGroup}>
      <h3>Créer un nouveau groupe d&apos;activités</h3>
      <input
        className="input-bordered input w-full"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      {error && (
        <p className="text-sm text-error">Le nom doit être renseigné</p>
      )}
    </Modal>
  );
};

type UpdateGroupProps = {
  userId?: string;
  groupId: string;
  variant?: TModalVariant;
  size?: ButtonSize;
};

export function UpdateGroup({
  userId,
  groupId,
  variant = "Icon-Outlined-Secondary",
  size = "sm",
}: UpdateGroupProps) {
  const utils = trpc.useContext();
  const groupQuery = trpc.activities.getActivityGroupById.useQuery(groupId, {
    enabled: isCUID(groupId),
    onSuccess(data) {
      setName(data?.name ?? "");
      setDefaultGroup(data?.default ?? false);
    },
  });
  const updateGroup = trpc.activities.updateGroup.useMutation({
    onSuccess: () => {
      userId
        ? utils.activities.getActivityGroupsForUser.invalidate(userId)
        : utils.activities.getAllActivityGroups.invalidate(),
        toast.success(t("group.updated") as string);
    },
    onError(error) {
      toast.error(error.message);
    },
  });
  const [name, setName] = useState("");
  const [defaultGroup, setDefaultGroup] = useState(false);
  const [error, setError] = useState(false);
  const { t } = useTranslation("club");

  function update() {
    if (name === "") {
      setError(true);
      return;
    }
    setError(false);
    updateGroup.mutate({
      id: groupId,
      name,
      default: userId ? false : defaultGroup ?? false,
    });
  }

  return (
    <Modal
      title={t("group.update")}
      handleSubmit={update}
      buttonIcon={<i className={`bx bx-edit bx-${size}`} />}
      variant={variant}
      buttonSize={size}
    >
      <h3>
        {t("group.update")}&nbsp;
        <span className="text-primary">{groupQuery.data?.name}</span>
      </h3>
      {groupQuery.isLoading ? (
        <Spinner />
      ) : (
        <>
          <input
            className="input-bordered input w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {error && <p className="text-sm text-error">{t("name-mandatory")}</p>}
          {userId ? null : (
            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-4">
                <input
                  type="checkbox"
                  checked={defaultGroup}
                  className="checkbox-primary checkbox"
                  onChange={(e) => setDefaultGroup(e.currentTarget.checked)}
                  disabled={!groupQuery.data?.userId}
                />
                <span className="label-text">{t("group.default")}</span>
              </label>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}

type DeleteGroupProps = {
  userId?: string;
  groupId: string;
  variant?: TModalVariant;
  size?: ButtonSize;
};

export function DeleteGroup({
  groupId,
  userId,
  size = "sm",
  variant = "Icon-Outlined-Secondary",
}: DeleteGroupProps) {
  const utils = trpc.useContext();
  const deleteGroup = trpc.activities.deleteGroup.useMutation({
    onSuccess: () => {
      userId
        ? utils.activities.getActivityGroupsForUser.invalidate(userId)
        : utils.activities.getAllActivityGroups.invalidate(),
        toast.success(t("group.deleted") as string);
    },
    onError(error) {
      toast.error(error.message);
    },
  });
  const { t } = useTranslation("club");

  return (
    <Confirmation
      title={t("group.deletion")}
      message={t("group.deletion-message")}
      onConfirm={() => deleteGroup.mutate({ groupId })}
      buttonIcon={<i className={`bx bx-trash bx-${size}`} />}
      variant={variant}
      textConfirmation={t("group.deletion-confirmation")}
      buttonSize={size}
    />
  );
}
