import { Role } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useEffect, useState, type FC } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { CgTrash } from "react-icons/cg";
import { trpc } from "../../utils/trpc";
import Confirmation from "../modals/confirmation";
import CreateClub from "../modals/createClub";
import { CreateSite, UpdateSite } from "../modals/createSite";
import { ModalVariant } from "../ui/modal";
import SimpleForm from "../ui/simpleform";
import Spinner from "../ui/spinner";

type Props = {
  userId: string;
};

const ManagerHomePage: FC<Props> = ({ userId }: Props) => {
  const { data: sessionData } = useSession();
  const clubQuery = trpc.clubs.getClubsForManager.useQuery(userId);
  const [clubId, setClubId] = useState("");

  useEffect(() => {
    if (clubQuery.data?.length && clubId === "")
      setClubId(clubQuery.data[0]?.id || "");
  }, [clubQuery.data, clubId]);

  if (
    sessionData &&
    ![Role.MANAGER, Role.MANAGER_COACH].includes(sessionData.user?.role)
  )
    return <div>Cette page est réservée aux managers de clubs</div>;

  return (
    <div className="container mx-auto">
      <div className="mb-4 flex flex-row items-center gap-8">
        <h1>Gérer mes clubs</h1>
        <CreateClub />
      </div>
      <div className="flex gap-4">
        {clubQuery.isLoading ? (
          <Spinner />
        ) : (
          <ul className="menu w-56 bg-base-100">
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
        {clubId === "" ? null : (
          <div className="w-full rounded border border-primary p-4">
            <ClubContent clubId={clubId} />
          </div>
        )}
      </div>
    </div>
  );
};

type ClubContentProps = {
  clubId: string;
};

type FormValues = {
  name: string;
  address: string;
};

function ClubContent({ clubId }: ClubContentProps) {
  const { data: sessionData } = useSession();
  const clubQuery = trpc.clubs.getClubById.useQuery(clubId, {
    onSuccess(data) {
      reset({ name: data?.name, address: data?.address });
    },
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>();
  const utils = trpc.useContext();
  const updateClub = trpc.clubs.updateClub.useMutation({
    onSuccess: () => {
      utils.clubs.getClubsForManager.invalidate(sessionData?.user?.id ?? "");
      utils.clubs.getClubById.refetch(clubId);
    },
  });
  const deleteClub = trpc.clubs.deleteClub.useMutation({
    onSuccess: () => {
      utils.clubs.getClubsForManager.invalidate(sessionData?.user?.id ?? "");
      utils.clubs.getClubById.refetch(clubId);
    },
  });
  const deleteSite = trpc.sites.deleteSite.useMutation({
    onSuccess: () => {
      utils.clubs.getClubsForManager.invalidate(sessionData?.user?.id ?? "");
      utils.clubs.getClubById.refetch(clubId);
    },
  });

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    updateClub.mutate({ id: clubId, ...data });
  };

  if (clubQuery.isLoading) return <Spinner />;

  return (
    <div className="flex flex-wrap items-start gap-4">
      <SimpleForm
        register={register}
        fields={[
          {
            label: "Nom du club",
            name: "name",
            required: "Le nom est obligatoire",
          },
          {
            label: "Adresse",
            name: "address",
            required: "Adresse obligatoire",
          },
        ]}
        errors={errors}
        onSubmit={handleSubmit(onSubmit)}
        className="w-1/2"
      >
        <div className="col-span-2 mt-4 flex flex-1 justify-end gap-4 border-t border-primary pt-4">
          <Confirmation
            message="Voulez-vou réellement supprimer ce club ?\nCette action est irréversible"
            title="Supprimer ce club"
            onConfirm={() => {
              deleteClub.mutate(clubId);
            }}
          />
          <button className="btn-primary btn" type="submit">
            Enregistrer les modifications
          </button>
        </div>
      </SimpleForm>
      <div className="flex flex-1 flex-col gap-4">
        <div className="rounded border border-primary p-4">
          <div className="mb-4 flex flex-row items-center gap-8">
            <h3>Sites</h3>
            <CreateSite
              clubId={clubId}
              onSuccess={() => {
                utils.clubs.getClubById.refetch(clubId);
              }}
            />
          </div>
          {clubQuery?.data?.sites?.map((site) => (
            <div key={site.id} className="my-2 flex items-center gap-4">
              <UpdateSite siteId={site.id} />
              <div className=""> {site.address} </div>
              <Confirmation
                message="Voulez-vou réellement supprimer ce site ?\nCette action est irréversible"
                title="Supprimer"
                buttonIcon={<CgTrash size={16} />}
                onConfirm={() => {
                  deleteSite.mutate(site.id);
                }}
                variant={ModalVariant.ICON_OUTLINED_SECONDARY}
              />
            </div>
          ))}
        </div>
        <div className="rounded border border-primary p-4">
          <h3>Activités</h3>
          {clubQuery?.data?.activities?.map((activity) => (
            <div key={activity.id} className="flex gap-4">
              <div className=""> {activity.name} </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ManagerHomePage;
