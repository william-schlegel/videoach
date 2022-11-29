import { Role } from "@prisma/client";
import { useSession } from "next-auth/react";
import type { FC } from "react";

type Props = {
  userId: string;
};

const CoachHomePage: FC<Props> = ({ userId }: Props) => {
  const { data: sessionData } = useSession();
  if (sessionData && sessionData.user?.role !== Role.COACH)
    return <div>Cette page est réservée aux managers de clubs</div>;

  return <div>CoachHomePage {userId}</div>;
};

export default CoachHomePage;
