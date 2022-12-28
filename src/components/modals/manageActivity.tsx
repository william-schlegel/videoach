import { trpc } from "../../utils/trpc";
import Modal from "../ui/modal";
import { useState } from "react";
import Confirmation from "../ui/confirmation";
import { useTranslation } from "next-i18next";

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
  const queryClubActivities = trpc.activities.getActivitiesForClub.useQuery({
    clubId,
    userId,
  });
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
      title={t("select-activities")}
      handleSubmit={onSubmit}
      submitButtonText={t("save-activities")}
      buttonIcon={<i className="bx bx-plus bx-xs" />}
      className="w-11/12 max-w-5xl"
    >
      <h3>{t("select-club-activities")}</h3>
      <div className="flex flex-1 gap-4">
        <div className="flex flex-col gap-2">
          <h4>{t("group")}</h4>
          <ul className="menu overflow-hidden rounded border border-secondary bg-base-100">
            {queryGroups.data?.map((group) => (
              <li key={group.id}>
                <div className={`flex ${groupId === group.id ? "active" : ""}`}>
                  <button onClick={() => setGroupId(group.id)}>
                    {group.name}
                  </button>
                  {withUpdate && !group.default && (
                    <>
                      <UpdateGroup
                        id={group.id}
                        userId={userId}
                        initialName={group.name}
                      />
                      <DeleteGroup groupId={group.id} userId={userId} />
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {withAdd ? <NewGroup userId={userId} /> : null}
        </div>
        <div className="flex flex-grow flex-col gap-2">
          <h4>{t("activities")}</h4>
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
  const groupQuery = trpc.activities.getActivityGroupById.useQuery(groupId);
  const createActivity = trpc.activities.createActivity.useMutation({
    onSuccess: () => utils.activities.getActivitiesForClub.invalidate(),
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
    <Modal title={t("new-activity")} handleSubmit={addNewActivity}>
      <h3>
        {t("create-activity-group")}
        <span className="text-primary">{groupQuery.data?.name}</span>
      </h3>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      {error && (
        <p className="text-sm text-error">{t("activity-name-mandatory")}</p>
      )}
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
    onSuccess: () => utils.activities.getActivitiesForClub.invalidate(),
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
      title={t("update-activity")}
      handleSubmit={update}
      buttonIcon={<i className="bx bx-edit bx-xs" />}
      variant={"Icon-Outlined-Primary"}
      buttonSize="btn-sm"
    >
      <h3>
        {t("update-activity")}
        <span className="text-primary">{initialName}</span>
      </h3>
      <input value={name} onChange={(e) => setName(e.target.value)} />
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
    onSuccess: () => utils.activities.getActivitiesForClub.invalidate(),
  });
  const { t } = useTranslation("club");

  return (
    <Confirmation
      title={t("activity-deletion")}
      message={t("activity-deletion-message")}
      onConfirm={() => deleteActivity.mutate({ clubId, activityId })}
      buttonIcon={<i className="bx bx-trash bx-xs" />}
      variant={"Icon-Outlined-Secondary"}
      textConfirmation={t("activity-deletion-confirmation")}
      buttonSize="btn-sm"
    />
  );
}

type NewGroupProps = {
  userId: string;
};

const NewGroup = ({ userId }: NewGroupProps) => {
  const utils = trpc.useContext();
  const createGroup = trpc.activities.createGroup.useMutation({
    onSuccess: () =>
      utils.activities.getActivityGroupsForUser.invalidate(userId),
  });
  const [name, setName] = useState("");
  const [error, setError] = useState(false);

  function addNewGroup() {
    if (name === "") {
      setError(true);
      return;
    }
    setError(false);
    createGroup.mutate({
      name,
      userId,
    });
  }

  return (
    <Modal title="Nouveau groupe" handleSubmit={addNewGroup}>
      <h3>Créer un nouveau groupe d&apos;activités</h3>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      {error && (
        <p className="text-sm text-error">Le nom doit être renseigné</p>
      )}
    </Modal>
  );
};

type UpdateGroupProps = {
  userId: string;
  id: string;
  initialName: string;
};

function UpdateGroup({ userId, id, initialName }: UpdateGroupProps) {
  const utils = trpc.useContext();
  const updateGroup = trpc.activities.updateGroup.useMutation({
    onSuccess: () =>
      utils.activities.getActivityGroupsForUser.invalidate(userId),
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
    updateGroup.mutate({
      id,
      name,
    });
  }

  return (
    <Modal
      title={t("update-group")}
      handleSubmit={update}
      buttonIcon={<i className="bx bx-edit bx-xs" />}
      variant={"Icon-Outlined-Secondary"}
      buttonSize="btn-sm"
    >
      <h3>
        {t("update-group")} <span className="text-primary">{initialName}</span>
      </h3>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      {error && (
        <p className="text-sm text-error">{t("group-name-mandatory")}</p>
      )}
    </Modal>
  );
}

type DeleteGroupProps = {
  userId: string;
  groupId: string;
};

function DeleteGroup({ groupId, userId }: DeleteGroupProps) {
  const utils = trpc.useContext();
  const deleteGroup = trpc.activities.deleteGroup.useMutation({
    onSuccess: () =>
      utils.activities.getActivityGroupsForUser.invalidate(userId),
  });
  const { t } = useTranslation("club");

  return (
    <Confirmation
      title={t("group-deletion")}
      message={t("group-deletion-message")}
      onConfirm={() => deleteGroup.mutate({ groupId })}
      buttonIcon={<i className="bx bx-trash bx-xs" />}
      variant={"Icon-Outlined-Secondary"}
      textConfirmation={t("group-deletion-confirmation")}
      buttonSize="btn-sm"
    />
  );
}
