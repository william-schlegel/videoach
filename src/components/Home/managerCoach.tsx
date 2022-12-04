import { Role } from "@prisma/client";
import { useSession } from "next-auth/react";
import { type FC } from "react";
import { trpc } from "../../utils/trpc";
import CreateClub from "../modals/createClub";
import Spinner from "../ui/spinner";

type Props = {
  userId: string;
};

const ManagerCoachHomePage: FC<Props> = ({ userId }: Props) => {
  const { data: sessionData } = useSession();

  const clubQuery = trpc.clubs.getClubsForManager.useQuery(userId);

  if (
    sessionData &&
    ![Role.MANAGER, Role.MANAGER_COACH].includes(sessionData.user?.role)
  )
    return <div>Cette page est réservée aux managers de clubs</div>;

  return (
    <div className="container mx-auto">
      <h1>Gérer ses clubs</h1>
      <div className="border-1 flex gap-4 rounded border-primary py-8">
        {clubQuery.isLoading ? (
          <Spinner />
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

export default ManagerCoachHomePage;
