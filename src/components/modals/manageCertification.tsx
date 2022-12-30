import { trpc } from "../../utils/trpc";
import Modal, { type TModalVariant } from "../ui/modal";
import {
  type Dispatch,
  type SetStateAction,
  useRef,
  useState,
  useMemo,
  KeyboardEventHandler,
} from "react";
import Confirmation from "../ui/confirmation";
import { useTranslation } from "next-i18next";
import {
  useForm,
  type SubmitHandler,
  type SubmitErrorHandler,
  type FieldErrorsImpl,
  type UseFormRegister,
} from "react-hook-form";
import { useSession } from "next-auth/react";
import SimpleForm from "@ui/simpleform";
import { SortableList } from "@ui/sortableList";
import ButtonIcon from "@ui/buttonIcon";
import Spinner from "@ui/spinner";

type CertificationFormValues = {
  name: string;
  certificationGroupId: string;
  obtainedIn: Date;
  documentUrl: string;
  activityGroups: string[];
  modules: string[];
  manualModule: string;
};

type CreateCertificationProps = {
  userId: string;
};

export const CreateCertification = ({ userId }: CreateCertificationProps) => {
  const [groupId, setGroupId] = useState("");
  const queryGroups = trpc.coachs.getCertificationGroups.useQuery(undefined, {
    onSuccess(data) {
      if (groupId === "" && data.length > 0) setGroupId(data[0]?.id || "");
    },
  });
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
      buttonIcon={<i className="bx bx-time bx-sm" />}
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
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex flex-grow flex-col gap-2">
          <h4>{t("certifications")}</h4>
          <div className="flex flex-wrap gap-2">
            {queryCoachCertifications.data?.certifications.map(
              (certification) => (
                <div key={certification.id} className="flex items-center gap-2">
                  <span className="flex items-center gap-1 rounded-full border border-primary px-4 py-2 text-primary-content">
                    {certification.name}
                  </span>
                </div>
              )
            )}
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
      buttonIcon={<i className="bx bx-edit bx-sm" />}
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
      buttonIcon={<i className="bx bx-trash bx-sm" />}
      variant={"Icon-Outlined-Secondary"}
      textConfirmation={t("certification-confirmation")}
    />
  );
};

type CertificationModuleForm = {
  dbId?: string;
  name: string;
  activityIds: string[];
};

type CertificationGroupForm = {
  name: string;
  modules: CertificationModuleForm[];
};

type CreateCertificationGroupProps = {
  variant?: TModalVariant;
};

const emptyData: CertificationGroupForm = { name: "", modules: [] };

export const CreateCertificationGroup = ({
  variant = "Primary",
}: CreateCertificationGroupProps) => {
  const { t } = useTranslation("admin");
  const utils = trpc.useContext();
  const [data, setData] = useState<CertificationGroupForm>(emptyData);
  const createGroup = trpc.coachs.createGroup.useMutation({
    onSuccess: () => {
      utils.coachs.getCertificationGroups.invalidate();
      setData(emptyData);
    },
  });

  const onSubmit = () => {
    if (!data) return;
    console.log("data :>> ", data);
    createGroup.mutate({
      name: data.name,
      modules: data.modules.map((m) => ({
        name: m.name,
        activityIds: m.activityIds,
      })),
    });
  };

  return (
    <Modal
      title={t("certification.new-group")}
      buttonIcon={<i className="bx bx-plus bx-sm" />}
      variant={variant}
      className="w-10/12 max-w-3xl"
      handleSubmit={onSubmit}
    >
      <h3>{t("certification.new-group")}</h3>
      <CertificationGroupForm data={data} setData={setData} />
    </Modal>
  );
};

type UpdateGroupProps = {
  groupId: string;
  variant?: TModalVariant;
};

export function UpdateCertificationGroup({
  groupId,
  variant = "Icon-Outlined-Primary",
}: UpdateGroupProps) {
  const { t } = useTranslation("admin");
  const utils = trpc.useContext();
  const [data, setData] = useState<CertificationGroupForm>(emptyData);
  const queryGroup = trpc.coachs.getCertificationGroupById.useQuery(groupId, {
    onSuccess(data) {
      setData({
        name: data?.name ?? "",
        modules:
          data?.modules.map((m) => ({
            dbId: m.id,
            name: m.name,
            activityIds: m.activityGroups.map((g) => g.id),
          })) ?? [],
      });
    },
  });
  const updateGroup = trpc.coachs.updateGroup.useMutation({
    onSuccess: () => {
      utils.coachs.getCertificationGroups.invalidate();
      setData(emptyData);
    },
  });

  const onSubmit = () => {
    console.log("data :>> ", data);
    updateGroup.mutate({
      id: groupId,
      name: data?.name ?? "",
      modules: data.modules.map((m) => ({
        id: m.dbId?.startsWith("MOD-") ? undefined : m.dbId,
        name: m.name,
        activityIds: m.activityIds,
      })),
    });
  };

  return (
    <Modal
      title={t("certification.update-group")}
      buttonIcon={<i className="bx bx-edit bx-sm" />}
      variant={variant}
      className="w-10/12 max-w-3xl"
      handleSubmit={onSubmit}
    >
      <h3>{t("certification.update-group")}</h3>
      {queryGroup.isLoading ? (
        <Spinner />
      ) : (
        <CertificationGroupForm data={data} setData={setData} />
      )}
    </Modal>
  );
}

type DeleteGroupProps = {
  groupId: string;
};

export function DeleteCertificationGroup({ groupId }: DeleteGroupProps) {
  const utils = trpc.useContext();
  const deleteGroup = trpc.coachs.deleteGroup.useMutation({
    onSuccess: () => utils.coachs.getCertificationGroups.invalidate(),
  });
  const { t } = useTranslation("coach");

  return (
    <Confirmation
      title={t("group-deletion")}
      message={t("group-deletion-message")}
      onConfirm={() => deleteGroup.mutate(groupId)}
      buttonIcon={<i className="bx bx-trash bx-sm" />}
      variant={"Icon-Outlined-Secondary"}
      textConfirmation={t("group-deletion-confirmation")}
      buttonSize="sm"
    />
  );
}

type CertificationGroupFormProps = {
  data: CertificationGroupForm;
  setData: Dispatch<SetStateAction<CertificationGroupForm>>;
};

function CertificationGroupForm({
  data,
  setData,
}: CertificationGroupFormProps): JSX.Element {
  const { t } = useTranslation("admin");
  const refOpt = useRef<HTMLInputElement>(null);
  const deleteModule = trpc.coachs.deleteModule.useMutation();
  const agQuery = trpc.activities.getAllActivityGroups.useQuery();
  const [moduleId, setModuleId] = useState("");
  const [activityIds, setActivityIds] = useState(new Set<string>());
  const [moduleName, setModuleName] = useState("");
  const selectedModule = useMemo(
    () => data.modules.find((m) => m.dbId === moduleId),
    [data.modules, moduleId]
  );

  function handleDeleteModule(id: number) {
    const mod = data.modules[id];
    if (!mod?.dbId?.startsWith("MOD-")) deleteModule.mutate(mod?.dbId ?? "");

    const mods = data.modules.filter((_, idx) => idx !== id);
    setData({ ...data, modules: mods });
  }

  function selectModule(dbId?: string) {
    setModuleId(dbId ?? "");
    const mod = data.modules.find((m) => m.dbId === dbId);
    setActivityIds(new Set(mod?.activityIds));
    setModuleName(mod?.name ?? "");
  }

  function addModule(mod?: CertificationModuleForm) {
    if (!mod) return;
    const mods = data.modules;
    if (!selectedModule) {
      mod.dbId = `MOD-${data.modules.length + 1}`;
      mods.push(mod);
    } else {
      const modIdx = mods.findIndex((m) => m.dbId === selectedModule.dbId);
      if (modIdx >= 0) mods[modIdx] = mod;
    }
    setData({ ...data, modules: mods });
    setActivityIds(new Set());
    setModuleName("");
    setModuleId("");
  }

  function addActivityId(activityId: string) {
    const mod = data.modules.find((m) => m.dbId === moduleId);
    if (!mod) {
      activityIds.add(activityId);
      setActivityIds(new Set(activityIds));
      return;
    }
    mod.activityIds.push(activityId);
    setData({ ...data });
  }

  function removeActivityId(activityId: string) {
    const mod = data.modules.find((m) => m.dbId === moduleId);
    if (!mod) {
      activityIds.delete(activityId);
      setActivityIds(new Set(activityIds));
      return;
    }
    mod.activityIds = mod.activityIds.filter((a) => a !== activityId);
    setData({ ...data });
  }

  function handleKeyboard(key: string, name: string) {
    if (key === "Enter") {
      addModule({
        name,
        activityIds: selectedModule?.activityIds ?? Array.from(activityIds),
      });
      if (refOpt.current) refOpt.current.value = "";
    }
    if (key === "Escape") {
      if (refOpt.current) refOpt.current.value = "";
      setActivityIds(new Set());
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <form className={`grid grid-cols-[auto_1fr] gap-2`}>
        <label>{t("certification.group-name")}</label>
        <input
          value={data.name}
          onChange={(e) => setData({ ...data, name: e.currentTarget.value })}
          type={"text"}
        />
        {data.name === "" ? (
          <p className="col-span-2 text-sm text-error">
            {t("certification.name-mandatory")}
          </p>
        ) : null}
      </form>
      <label>{t("certification.modules")}</label>
      <ul className="menu overflow-hidden rounded border border-base-300">
        {data.modules.map((mod, idx) => (
          <li key={mod.dbId}>
            <div
              className={`flex w-full items-center justify-between text-center ${
                moduleId === mod.dbId ? "active" : ""
              }`}
              onClick={() => selectModule(mod.dbId)}
            >
              <div className="flex flex-grow items-center justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <span>{mod.name}</span>
                  {mod.activityIds.map((id) => (
                    <span key={id} className="badge badge-primary">
                      {agQuery.data?.find((g) => g.id === id)?.name ?? "???"}
                    </span>
                  ))}
                </div>
                <button onClick={() => handleDeleteModule(idx)}>
                  <ButtonIcon
                    iconComponent={<i className="bx bx-trash bx-xs" />}
                    title={t("certification.delete-module")}
                    buttonVariant="Icon-Outlined-Secondary"
                    buttonSize="sm"
                  />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-2">
        <div className="flex flex-col gap-2 rounded-md border border-primary p-2">
          <input
            type={"text"}
            ref={refOpt}
            value={moduleName}
            onChange={(e) => {
              setModuleName(e.currentTarget.value);
            }}
            onKeyDown={(e) => handleKeyboard(e.key, e.currentTarget.value)}
          />
          <h3>{t("certification.linked-activities")}</h3>
          {agQuery.isLoading ? (
            <Spinner />
          ) : (
            <div className="flex flex-wrap gap-2">
              {agQuery.data?.map((ag) => (
                <button
                  className={`btn-primary btn-sm btn ${
                    selectedModule?.activityIds.includes(ag.id) ||
                    activityIds.has(ag.id)
                      ? ""
                      : "btn-outline"
                  }`}
                  key={ag.id}
                  onClick={() => {
                    if (selectedModule?.activityIds) {
                      const ids = selectedModule?.activityIds ?? [];
                      if (ids.includes(ag.id)) removeActivityId(ag.id);
                      else addActivityId(ag.id);
                    } else {
                      const ids = activityIds;
                      if (ids.has(ag.id)) removeActivityId(ag.id);
                      else addActivityId(ag.id);
                    }
                  }}
                >
                  {ag.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => {
            if (!refOpt.current) return;
            addModule({
              name: refOpt.current.value,
              activityIds:
                selectedModule?.activityIds ?? Array.from(activityIds),
            });
            handleKeyboard("Escape", "");
          }}
          onKeyDown={(e) => handleKeyboard(e.key, refOpt.current?.value ?? "")}
        >
          <ButtonIcon
            iconComponent={
              <i
                className={`bx ${selectedModule ? "bx-edit" : "bx-plus"} bx-sm`}
              />
            }
            title={t("pricing.add-option")}
            buttonVariant="Icon-Outlined-Primary"
            buttonSize="md"
          />
        </button>
      </div>
    </div>
  );
}
