import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { type FC } from "react";

const MENUS = [
  { label: "Le club", page: "/" },
  { label: "Activités", page: "/activites" },
  { label: "Planning", page: "/planning" },
  { label: "Coachs", page: "/coachs" },
  { label: "Réserver", page: "/reservation", acces: ["USER"] },
];

export default function Navbar() {
  const { data: sessionData } = useSession();

  return (
    <div className="navbar bg-base-100">
      <div className="navbar-start">
        <div className="dropdown">
          <label tabIndex={0} className="btn-ghost btn lg:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h8m-8 6h16"
              />
            </svg>
          </label>
          <ul
            tabIndex={0}
            className="dropdown-content menu rounded-box menu-compact mt-3 w-52 bg-base-100 p-2 shadow"
          >
            <Menu />
          </ul>
        </div>
        <Logo />
      </div>
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal p-0">
          <Menu />
        </ul>
      </div>

      <div className="navbar-end">
        {sessionData?.user?.id ? (
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn-ghost btn-circle avatar btn">
              <div className="w-10 rounded-full">
                <Image
                  src={sessionData.user?.image || "/images/dummy.jpg"}
                  alt=""
                  width={80}
                  height={80}
                />
              </div>
            </label>
            <ul
              tabIndex={0}
              className="dropdown-content menu rounded-box menu-compact mt-3 w-52 bg-base-100 p-2 shadow"
            >
              <li>
                <Link
                  className="justify-between"
                  href={`/user/${sessionData.user.id}`}
                >
                  Mes informations
                </Link>
              </li>
              <li>
                <div onClick={() => signOut()}>Se déconnecter</div>
              </li>
            </ul>
          </div>
        ) : (
          <ul className="menu menu-horizontal p-0">
            <li>
              <div onClick={() => signIn()}>Se connecter</div>
            </li>
            <li>
              <Link href="/user/signin">Créer un compte</Link>
            </li>
          </ul>
        )}
      </div>
    </div>
  );
}

const Menu: FC = () => {
  const { data: sessionData } = useSession();

  return (
    <>
      {MENUS.map((menu) => {
        if (
          Array.isArray(menu.acces) &&
          (!sessionData?.user?.role ||
            !menu.acces.includes(sessionData.user.role))
        )
          return null;
        return (
          <li key={menu.page}>
            <Link className="justify-between" href={menu.page}>
              {menu.label}
            </Link>
          </li>
        );
      })}
    </>
  );
};

const Logo: FC = () => {
  return (
    <div className="flex-1">
      <a className="btn-ghost btn text-2xl capitalize">Videoach</a>
    </div>
  );
};
