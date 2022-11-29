import { Role } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useRef } from "react";
import { trpc } from "../../utils/trpc";

const ManagerHomePage = () => {
  const { data: sessionData } = useSession();

  const clubQuery = trpc.clubs.getClubsForManager.useQuery(
    sessionData?.user?.id || ""
  );

  if (sessionData && sessionData.user?.role !== Role.MANAGER)
    return <div>Cette page est réservée aux managers de clubs</div>;

  return (
    <div className="container mx-auto">
      <h1>Gérer ses clubs</h1>
      <div className="border-1 flex gap-4 rounded border-primary py-8">
        {clubQuery.isLoading ? (
          <div>Loading</div>
        ) : (
          clubQuery.data?.map((club) => (
            <div className="card" key={club.id}>
              {club.name}
            </div>
          ))
        )}
        <CreateClub />
      </div>
    </div>
  );
};

export default ManagerHomePage;

const CreateClub = () => {
  const { data: sessionData } = useSession();
  const utils = trpc.useContext();
  const closeRef = useRef<HTMLInputElement>(null);
  const createClub = trpc.clubs.createClub.useMutation({
    onSuccess: () => {
      utils.clubs.getClubsForManager.invalidate(sessionData?.user?.id ?? "");
    },
  });

  const handleSubmit = () => {
    if (!closeRef.current) return;
    closeRef.current.checked = false;
  };

  return (
    <>
      <label htmlFor="club-creation-modal" className="btn-primary btn">
        Créer un nouveau club
      </label>

      <input
        type="checkbox"
        id="club-creation-modal"
        className="modal-toggle"
        ref={closeRef}
      />
      <div className="modal">
        <div className="modal-box relative">
          <label
            htmlFor="club-creation-modal"
            className="btn-secondary btn-sm btn-circle btn absolute right-2 top-2"
          >
            ✕
          </label>
          <h3 className="text-lg font-bold">Créer un nouveau club</h3>
          <p className="py-4">
            Saisissez les informations relatives à votre nouveau club
          </p>
          <div className="modal-action">
            <button className="btn-primary btn" onClick={handleSubmit}>
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
