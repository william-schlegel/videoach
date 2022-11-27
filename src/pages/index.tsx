import { type NextPage } from "next";
import { useSession } from "next-auth/react";

const Home: NextPage = () => {
  const { data: sessionData } = useSession();
  console.log("sessionData :>> ", sessionData);

  return <div>Home</div>;
};

export default Home;
