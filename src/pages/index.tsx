import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import PublicHomePage from "../components/Home/public";
import UserHomePage from "../components/Home/user";

const Home: NextPage = () => {
  const { data: sessionData } = useSession();
  console.log("sessionData :>> ", sessionData);
  if (!sessionData) return <PublicHomePage />;
  if (sessionData.user?.role === "USER")
    return <UserHomePage userId={sessionData.user.id} />;
  return <div>Home pour {sessionData.user?.role}</div>;
};

export default Home;
