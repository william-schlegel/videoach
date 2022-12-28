import { Role } from "@prisma/client";
import { type GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18nConfig from "../../next-i18next.config.mjs";
import { authOptions } from "./api/auth/[...nextauth]";
import { unstable_getServerSession } from "next-auth/next";
import Image from "next/image.js";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router.js";
import { CgSearch } from "react-icons/cg";
import Map from "react-map-gl";
import { env } from "../env/client.mjs";
// import { useState } from "react";
import { trpc } from "@trpcclient/trpc";
import Rating from "@ui/rating";

// type ClubSearchResult = {
//   name: string;
//   distance: number;
//   activities: string[];
// };

// type CoachSearchResult = {
//   image: string;
//   rating: number;
//   name: string;
//   distance: number;
//   certifications: string[];
// };

const Home = () => {
  const { t } = useTranslation("home");
  const router = useRouter();
  // const [clubSearch, setClubSearch] = useState<ClubSearchResult[]>([]);
  // const [coachSearch, setCoachSearch] = useState<CoachSearchResult[]>([]);
  const clubSearch = trpc.clubs.getAllClubs.useQuery();
  const coachSearch = trpc.coachs.getAllCoachs.useQuery();

  type clubItem = typeof clubSearch.data extends (infer U)[] | undefined
    ? U
    : never;

  function getGroups(club: clubItem) {
    const grps = club.activities.map((a) => a.group.name).flat();
    const set = new Set(grps);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }

  return (
    <div>
      <section className="bg-gradient-home-hero hero min-h-screen">
        <div className="hero-content flex-col lg:flex-row-reverse">
          <Image
            src="/images/bruce-mars-gJtDg6WfMlQ-unsplash.jpg"
            alt=""
            width={800}
            height={800}
            className="max-w-lg rounded-lg shadow-2xl"
          />

          <div>
            <h1 className="text-6xl font-bold">{t("title")}</h1>
            <p className="py-6">{t("hero-text")}</p>
            <div className="flex flex-wrap gap-2">
              <button
                className="btn btn-accent"
                onClick={() => router.push("#find-club")}
              >
                {t("btn-visitor")}
              </button>
              <button
                className="btn btn-primary"
                onClick={() => router.push("/manager")}
              >
                {t("btn-manager")}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => router.push("/coach")}
              >
                {t("btn-coach")}
              </button>
            </div>
          </div>
        </div>
      </section>
      <section id="find-club" className="bg-base-200">
        <div className="container mx-auto p-4">
          <h2>{t("find-club")}</h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="flex flex-col items-center">
              <div className="form-control w-full max-w-sm">
                <label className="label">
                  <span className="label-text">{t("my-address")}</span>
                </label>
                <input type="text" className="input-bordered input w-full" />
              </div>
              <div className="form-control w-full max-w-xs">
                <label className="label">
                  <span className="label-text">{t("search-radius")}</span>
                </label>
                <label className="input-group">
                  <input
                    type="number"
                    className="input-bordered input w-full text-end"
                    defaultValue={50}
                  />
                  <span>Km</span>
                </label>
              </div>
              <button className="btn btn-primary flex items-center gap-4">
                {t("search-club")}
                <CgSearch size={16} />
              </button>
              <div className="mt-8 max-h-60 w-full border border-primary">
                <table className="table-zebra table w-full">
                  <thead>
                    <tr>
                      <th>{t("club")}</th>
                      <th>{t("distance")}</th>
                      <th>{t("activities")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clubSearch.data?.map((res) => (
                      <tr key={res.name}>
                        <td>{res.name}</td>
                        <td>{/*res.distance*/ "(tbd)"}&nbsp;km</td>
                        <td className="flex flex-wrap gap-2">
                          {getGroups(res).map((g) => (
                            <span key={g}>{g}</span>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="min-h-[50vh]">
              <div className="h-full border border-primary">
                <Map
                  initialViewState={{
                    longitude: 2.1942669,
                    latitude: 49.0912333,
                    zoom: 12,
                  }}
                  style={{ width: "100%", height: "100%" }}
                  mapStyle="mapbox://styles/mapbox/streets-v9"
                  mapboxAccessToken={env.NEXT_PUBLIC_MAPBOX_TOKEN}
                  attributionControl={false}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="find-coach" className="bg-base-100">
        <div className="container mx-auto p-4">
          <h2>{t("find-coach")}</h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="flex flex-col items-center">
              <div className="form-control w-full max-w-sm">
                <label className="label">
                  <span className="label-text">{t("my-address")}</span>
                </label>
                <input type="text" className="input-bordered input w-full" />
              </div>
              <div className="form-control w-full max-w-xs">
                <label className="label">
                  <span className="label-text">{t("search-radius")}</span>
                </label>
                <label className="input-group">
                  <input
                    type="number"
                    className="input-bordered input w-full text-end"
                    defaultValue={50}
                  />
                  <span>Km</span>
                </label>
              </div>
              <button className="btn btn-primary flex items-center gap-4">
                {t("search-coach")}
                <CgSearch size={16} />
              </button>
              <div className="mt-8 max-h-60 w-full border border-primary">
                <table className="table-zebra table w-full">
                  <thead>
                    <tr>
                      <th>{t("coach")}</th>
                      <th>{t("distance")}</th>
                      <th>{t("rating")}</th>
                      <th>{t("certifications")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coachSearch.data?.map((res) => (
                      <tr key={res.name}>
                        <td>{res.name}</td>
                        <td>{/*res.distance*/ "(tbd)"}&nbsp;km</td>
                        <td>
                          <Rating note={res.rating} />
                        </td>
                        <td className="flex flex-wrap gap-2">
                          {/*res.certifications.map((cert) => (
                            <span key={cert}>{cert}</span>
                          ))*/}
                          tbd
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="min-h-[50vh]">
              <div className="h-full border border-primary">
                <Map
                  initialViewState={{
                    longitude: 2.1942669,
                    latitude: 49.0912333,
                    zoom: 12,
                  }}
                  style={{ width: "100%", height: "100%" }}
                  mapStyle="mapbox://styles/mapbox/streets-v9"
                  mapboxAccessToken={env.NEXT_PUBLIC_MAPBOX_TOKEN}
                  attributionControl={false}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

export const getServerSideProps = async ({
  locale,
  req,
  res,
}: GetServerSidePropsContext) => {
  const session = await unstable_getServerSession(req, res, authOptions);
  let destination = "";
  if (session) {
    if (session.user?.role === Role.MEMBER)
      destination = `/member/${session.user.id}`;
    if (session.user?.role === Role.COACH)
      destination = `/coach/${session.user.id}`;
    if (session.user?.role === Role.MANAGER)
      destination = `/manager/${session.user.id}`;
    if (session.user?.role === Role.MANAGER_COACH)
      destination = `/manager-coach/${session.user.id}`;
    if (session.user?.role === Role.ADMIN)
      destination = `/admin/${session.user.id}`;
  }
  return {
    redirect: destination
      ? {
          destination,
          permanent: false,
        }
      : undefined,
    props: {
      session,
      ...(await serverSideTranslations(
        locale ?? "fr",
        ["common", "home"],
        nextI18nConfig
      )),
    },
  };
};
