import { trpc } from "../../utils/trpc";
import Modal, { ModalVariant } from "../ui/modal";
import { CgAdd, CgPen, CgTrash } from "react-icons/cg";
import { useState } from "react";
import Confirmation from "./confirmation";

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

  const onSubmit = () => {
    updateClubActivities.mutate({
      id: clubId,
      activities: queryClubActivities.data?.activities.map((a) => a.id) || [],
    });
  };

  return (
    <Modal
      title="Sélectionner les activités du club"
      handleSubmit={onSubmit}
      submitButtonText="Enregistrer"
      buttonIcon={<CgAdd size={16} />}
      className="w-11/12 max-w-5xl"
    >
      <h3>Sélectionner les activités proposées dans ce club</h3>
      <div className="flex flex-1 gap-4">
        <div className="flex flex-col gap-2">
          <h4>Groupe</h4>
          <ul className="menu rounded-md border border-secondary bg-base-100">
            {queryGroups.data?.map((group) => (
              <li key={group.id}>
                <button
                  className={`w-full ${groupId === group.id ? "active" : ""}`}
                  onClick={() => setGroupId(group.id)}
                >
                  {group.name}
                </button>
              </li>
            ))}
          </ul>
          {withAdd ? (
            <button className="btn-secondary btn w-full">Nouveau groupe</button>
          ) : null}
        </div>
        <div className="flex flex-grow flex-col gap-2">
          <h4>Activités</h4>
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

type NewActivityType = {
  clubId: string;
  groupId: string;
};

const NewActivity = ({ clubId, groupId }: NewActivityType) => {
  const utils = trpc.useContext();
  const groupQuery = trpc.activities.getActivityGroupById.useQuery(groupId);
  const createActivity = trpc.activities.createActivity.useMutation({
    onSuccess: () => utils.activities.getActivitiesForClub.invalidate(),
  });
  const [name, setName] = useState("");
  const [error, setError] = useState(false);

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
    <Modal title="Nouvelle activité" handleSubmit={addNewActivity}>
      <h3>
        Créer une nouvelle activité dans le groupe{" "}
        <span className="text-primary">{groupQuery.data?.name}</span>
      </h3>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      {error && (
        <p className="text-sm text-error">Le nom doit être renseigné</p>
      )}
    </Modal>
  );
};

type UpdateActivityType = {
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
}: UpdateActivityType) {
  const utils = trpc.useContext();
  const updateActivity = trpc.activities.updateActivity.useMutation({
    onSuccess: () => utils.activities.getActivitiesForClub.invalidate(),
  });
  const [name, setName] = useState(initialName);
  const [error, setError] = useState(false);

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
      title="Modifier l'activité"
      handleSubmit={update}
      buttonIcon={<CgPen size={12} />}
      variant={ModalVariant.ICON_OUTLINED_SECONDARY}
      buttonSize="btn-sm"
    >
      <h3>
        Modifier l&apos;activité{" "}
        <span className="text-primary">{initialName}</span>
      </h3>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      {error && (
        <p className="text-sm text-error">Le nom doit être renseigné</p>
      )}
    </Modal>
  );
}

type DeleteActivityType = {
  clubId: string;
  activityId: string;
};

function DeleteActivity({ clubId, activityId }: DeleteActivityType) {
  const utils = trpc.useContext();
  const deleteActivity = trpc.activities.deleteActivity.useMutation({
    onSuccess: () => utils.activities.getActivitiesForClub.invalidate(),
  });

  return (
    <Confirmation
      title="Supprimer l'activité"
      message="Voulez-vous supprimer cette activité ?\nCette action est irréversible"
      onConfirm={() => deleteActivity.mutate({ clubId, activityId })}
      buttonIcon={<CgTrash size={12} />}
      variant={ModalVariant.ICON_OUTLINED_SECONDARY}
      textConfirmation="Supprimer définitivement"
      buttonSize="btn-sm"
    />
  );
}
