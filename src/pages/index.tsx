import { Role } from "@prisma/client";
import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import AdminHomePage from "../components/Home/admin";
import CoachHomePage from "../components/Home/coach";
import ManagerHomePage from "../components/Home/manager";
import PublicHomePage from "../components/Home/public";
import UserHomePage from "../components/Home/user";

const Home: NextPage = () => {
  const { data: sessionData } = useSession();
  if (!sessionData) return <PublicHomePage />;
  if (sessionData.user?.role === Role.USER)
    return <UserHomePage userId={sessionData.user.id} />;
  if (sessionData.user?.role === Role.COACH)
    return <CoachHomePage userId={sessionData.user.id} />;
  if (sessionData.user?.role === Role.MANAGER)
    return <ManagerHomePage userId={sessionData.user.id} />;
  if (sessionData.user?.role === Role.ADMIN)
    return <AdminHomePage userId={sessionData.user.id} />;
  return <div>Home pour {sessionData.user?.role}</div>;
};

export default Home;
