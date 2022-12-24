import { trpc } from "../../utils/trpc";
import Modal from "../ui/modal";
import { CgAdd, CgPen, CgTrash } from "react-icons/cg";
import { PropsWithoutRef, useState } from "react";
import Confirmation from "../ui/confirmation";
import { useTranslation } from "next-i18next";
import {
  useForm,
  type SubmitHandler,
  type SubmitErrorHandler,
  type FieldValues,
  type FieldErrorsImpl,
  type UseFormRegister,
  type UseFormGetValues,
  type Path,
} from "react-hook-form";
import { useSession } from "next-auth/react";
import SimpleForm from "@ui/simpleform";

type CertificationFormValues = {
  name: string;
  certificationGroupId: string;
  obtainedIn: Date;
  documentUrl: string;
  activityGroupId: string;
  modules: string[];
};

type CreateCertificationProps = {
  userId: string;
};

export const CreateCertification = ({ userId }: CreateCertificationProps) => {
  const [groupId, setGroupId] = useState("");
  const [moduleId, setModuleId] = useState("");
  const queryGroups = trpc.coachs.getCertificationGroupsForCoach.useQuery(
    userId,
    {
      onSuccess(data) {
        if (groupId === "" && data.length > 0) setGroupId(data[0]?.id || "");
      },
    }
  );
  const queryCoachCertifications =
    trpc.coachs.getCertificationsForCoach.useQuery(userId);
  const addCertification = trpc.coachs.createCertification.useMutation();
  const { t } = useTranslation("coach");

  const selectedGroup = queryGroups.data?.find((g) => g.id === groupId);

  const onSubmit = () => {
    // updateClubActivities.mutate({
    //   id: clubId,
    //   activities: queryClubActivities.data?.activities.map((a) => a.id) || [],
    // });
  };

  return (
    <Modal
      title={t("create-certification")}
      handleSubmit={onSubmit}
      submitButtonText={t("save-certifications")}
      buttonIcon={<CgAdd size={16} />}
      className="w-11/12 max-w-5xl"
    >
      <h3>{t("create-certification")}</h3>
      <div className="flex flex-1 gap-4">
        <div className="flex flex-col items-stretch justify-between gap-2">
          <div>
            <h4>{t("certification-provider")}</h4>
            <ul className="menu overflow-hidden rounded border border-secondary bg-base-100">
              {queryGroups.data?.map((group) => (
                <li key={group.id}>
                  <div
                    className={`flex ${groupId === group.id ? "active" : ""}`}
                  >
                    <button
                      className="flex w-full items-center justify-between"
                      onClick={() => setGroupId(group.id)}
                    >
                      {group.name}
                      {!group.default && (
                        <div className="flex">
                          <UpdateGroup
                            id={group.id}
                            coachId={userId}
                            initialName={group.name}
                          />
                          <DeleteGroup groupId={group.id} coachId={userId} />
                        </div>
                      )}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <NewGroup userId={userId} />
        </div>
        {selectedGroup?.hasModules ? (
          <div className="flex flex-col items-stretch justify-between gap-2">
            <div>
              <h4>{t("modules")}</h4>
              <ul className="menu overflow-hidden rounded border border-secondary bg-base-100">
                {selectedGroup.modules.map((mod) => (
                  <li key={mod.id}>
                    <div
                      className={`flex ${moduleId === mod.id ? "active" : ""}`}
                    >
                      <button
                        className="flex w-full items-center justify-between"
                        onClick={() => setModuleId(mod.id)}
                      >
                        {mod.name}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <NewModule groupId={groupId} />
          </div>
        ) : null}
        <div className="flex flex-grow flex-col gap-2">
          <h4>{t("certifications")}</h4>
          <div className="flex flex-wrap gap-2">
            {queryCoachCertifications.data?.certifications
              .filter((c) => c.certificationGroupId === groupId)
              .map((certification) => (
                <div key={certification.id} className="flex items-center gap-2">
                  <span className="flex items-center gap-1 rounded-full border border-primary px-4 py-2 text-primary-content">
                    {certification.name}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};

type UpdateCertificationProps = {
  certificationId: string;
};

export const UpdateCertification = ({
  certificationId,
}: UpdateCertificationProps) => {
  const { data: sessionData } = useSession();
  const utils = trpc.useContext();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CertificationFormValues>();
  const { t } = useTranslation("coach");
  const queryCertification = trpc.coachs.getCertificationById.useQuery(
    certificationId,
    {
      onSuccess(data) {
        reset({ name: data?.name });
      },
    }
  );
  const updateCertification = trpc.coachs.updateCertification.useMutation({
    onSuccess: () => {
      utils.coachs.getCertificationsForCoach.invalidate(
        sessionData?.user?.id ?? ""
      );
    },
  });

  const onSubmit: SubmitHandler<CertificationFormValues> = (data) => {
    updateCertification.mutate({ id: certificationId, ...data });
  };

  const onError: SubmitErrorHandler<CertificationFormValues> = (errors) => {
    console.log("errors", errors);
  };

  return (
    <Modal
      title={t("update-certification")}
      handleSubmit={handleSubmit(onSubmit, onError)}
      submitButtonText="Enregistrer"
      errors={errors}
      buttonIcon={<CgPen size={16} />}
      variant={"Icon-Outlined-Primary"}
    >
      <h3>
        {t("update-certification")} {queryCertification.data?.name}
      </h3>
      <SimpleForm
        errors={errors}
        register={register}
        isLoading={queryCertification.isLoading}
        fields={[
          {
            label: t("certification-name"),
            name: "name",
            required: t("name-mandatory"),
          },
        ]}
      />
    </Modal>
  );
};

export const DeleteCertification = ({
  certificationId,
}: UpdateCertificationProps) => {
  const utils = trpc.useContext();
  const { data: sessionData } = useSession();
  const { t } = useTranslation("coach");

  const deleteCertification = trpc.coachs.deleteCertification.useMutation({
    onSuccess: () => {
      utils.coachs.getCertificationsForCoach.invalidate(
        sessionData?.user?.id ?? ""
      );
    },
  });

  return (
    <Confirmation
      message={t("certification-deletion-message")}
      title={t("certification-deletion")}
      onConfirm={() => {
        deleteCertification.mutate(certificationId);
      }}
      buttonIcon={<CgTrash size={16} />}
      variant={"Icon-Outlined-Secondary"}
      textConfirmation={t("certification-confirmation")}
    />
  );
};

type NewGroupProps = {
  userId: string;
};

const NewGroup = ({ userId }: NewGroupProps) => {
  const utils = trpc.useContext();
  const createGroup = trpc.coachs.createGroup.useMutation({
    onSuccess: () =>
      utils.coachs.getCertificationGroupsForCoach.invalidate(userId),
  });
  const [name, setName] = useState("");
  const [error, setError] = useState(false);
  const { t } = useTranslation("coach");

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
    <Modal title={t("new-group")} handleSubmit={addNewGroup}>
      <h3>{t("create-group")}</h3>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      {error && (
        <p className="text-sm text-error">{t("group-name-mandatory")}</p>
      )}
    </Modal>
  );
};

type UpdateGroupProps = {
  coachId: string;
  id: string;
  initialName: string;
};

function UpdateGroup({ coachId, id, initialName }: UpdateGroupProps) {
  const utils = trpc.useContext();
  const updateGroup = trpc.coachs.updateGroup.useMutation({
    onSuccess: () =>
      utils.coachs.getCertificationGroupsForCoach.invalidate(coachId),
  });
  const [name, setName] = useState(initialName);
  const [error, setError] = useState(false);
  const { t } = useTranslation("coach");

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
      buttonIcon={<CgPen size={12} />}
      variant={"Icon-Outlined-Primary"}
      buttonSize="btn-sm"
    >
      <h3>
        {t("update-group")}
        <span className="text-primary">{initialName}</span>
      </h3>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      {error && (
        <p className="text-sm text-error">{t("group-name-mandatory")}</p>
      )}
    </Modal>
  );
}

type DeleteGroupProps = {
  coachId: string;
  groupId: string;
};

function DeleteGroup({ coachId, groupId }: DeleteGroupProps) {
  const utils = trpc.useContext();
  const deleteGroup = trpc.coachs.deleteGroup.useMutation({
    onSuccess: () =>
      utils.coachs.getCertificationGroupsForCoach.invalidate(coachId),
  });
  const { t } = useTranslation("coach");

  return (
    <Confirmation
      title={t("group-deletion")}
      message={t("group-deletion-message")}
      onConfirm={() => deleteGroup.mutate(groupId)}
      buttonIcon={<CgTrash size={12} />}
      variant={"Icon-Outlined-Secondary"}
      textConfirmation={t("group-deletion-confirmation")}
      buttonSize="btn-sm"
    />
  );
}

type NewModuleProps = {
  groupId: string;
};

const NewModule = ({ groupId }: NewModuleProps) => {
  const utils = trpc.useContext();
  const createModule = trpc.coachs.createModule.useMutation({
    onSuccess: () => utils.coachs.getCertificationGroupById.invalidate(groupId),
  });
  const [name, setName] = useState("");
  const [error, setError] = useState(false);
  const { t } = useTranslation("coach");

  function addNewModule() {
    if (name === "") {
      setError(true);
      return;
    }
    setError(false);
    createModule.mutate({
      name,
      groupId,
    });
  }

  return (
    <Modal title={t("new-module")} handleSubmit={addNewModule}>
      <h3>{t("create-new-module")}</h3>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      {error && (
        <p className="text-sm text-error">{t("module-name-mandatory")}</p>
      )}
    </Modal>
  );
};

type UpdateModuleProps = {
  groupId: string;
  id: string;
  initialName: string;
};

function UpdateModule({ groupId, id, initialName }: UpdateModuleProps) {
  const utils = trpc.useContext();
  const updateGroup = trpc.coachs.updateGroup.useMutation({
    onSuccess: () => utils.coachs.getCertificationGroupById.invalidate(groupId),
  });
  const [name, setName] = useState(initialName);
  const [error, setError] = useState(false);
  const { t } = useTranslation("coach");

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
      title={t("update-module")}
      handleSubmit={update}
      buttonIcon={<CgPen size={12} />}
      variant={"Icon-Outlined-Secondary"}
      buttonSize="btn-sm"
    >
      <h3>
        {t("update-module")} <span className="text-primary">{initialName}</span>
      </h3>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      {error && (
        <p className="text-sm text-error">{t("module-name-mandatory")}</p>
      )}
    </Modal>
  );
}

type DeleteModuleProps = {
  groupId: string;
  moduleId: string;
};

function DeleteModule({ groupId, moduleId }: DeleteModuleProps) {
  const utils = trpc.useContext();
  const deleteModule = trpc.coachs.deleteModule.useMutation({
    onSuccess: () => utils.coachs.getCertificationGroupById.invalidate(groupId),
  });
  const { t } = useTranslation("coach");

  return (
    <Confirmation
      title={t("module-deletion")}
      message={t("module-deletion-message")}
      onConfirm={() => deleteModule.mutate(moduleId)}
      buttonIcon={<CgTrash size={12} />}
      variant={"Icon-Outlined-Secondary"}
      textConfirmation={t("module-deletion-confirmation")}
      buttonSize="btn-sm"
    />
  );
}
