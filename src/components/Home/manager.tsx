import { Role } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useEffect, useState, type FC } from "react";
import { trpc } from "../../utils/trpc";
import CreateClub, { ClubContent } from "../modals/manageClub";
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
            <ClubContent userId={userId} clubId={clubId} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerHomePage;
