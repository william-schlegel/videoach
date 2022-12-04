import { Role } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useEffect, useState, type FC } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { trpc } from "../../utils/trpc";
import Confirmation from "../modals/confirmation";
import CreateClub from "../modals/createClub";
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
    },
  });
  const deleteClub = trpc.clubs.deleteClub.useMutation({
    onSuccess: () => {
      utils.clubs.getClubsForManager.invalidate(sessionData?.user?.id ?? "");
    },
  });

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    console.log("data", data);
    updateClub.mutate({ id: clubId, ...data });
  };

  if (clubQuery.isLoading) return <Spinner />;
  return (
    <>
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
    </>
  );
}

export default ManagerHomePage;
