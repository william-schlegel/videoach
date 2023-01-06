import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18nConfig from "../../next-i18next.config.mjs";
import Image from "next/image.js";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router.js";
import Map, { Layer, Source } from "react-map-gl";
import { env } from "@root/src/env/client.mjs";
// import { useState } from "react";
import { trpc } from "@trpcclient/trpc";
import Rating from "@ui/rating";
import Layout from "@root/src/components/layout";
import Link from "next/link";
import ButtonIcon from "@ui/buttonIcon";
import AddressSearch, { type AddressData } from "@ui/addressSearch";
import { useMemo, useState } from "react";
import hslToHex from "@lib/hslToHex";
import turfCircle from "@turf/circle";
import useLocalStorage from "@lib/useLocalstorage";
import { type TThemes } from "@root/src/components/themeSelector";

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
  const [myAddress, setMyAddress] = useState<AddressData>({
    address: "",
    lat: 48.8583701,
    lng: 2.2944813,
  });
  const [range, setRange] = useState(10);
  const [theme] = useLocalStorage<TThemes>("theme", "cupcake");

  type clubItem = typeof clubSearch.data extends (infer U)[] | undefined
    ? U
    : never;

  function getGroups(club: clubItem) {
    const grps = club.activities.map((a) => a.group.name).flat();
    const set = new Set(grps);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }
  const circle = useMemo(() => {
    const center = [myAddress.lng ?? 2.2944813, myAddress.lat ?? 48.8583701];
    const c = turfCircle(center, range ?? 10, {
      steps: 64,
      units: "kilometers",
      properties: {},
    });
    return c;
  }, [myAddress.lat, myAddress.lng, range]);

  return (
    <Layout>
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
                className="btn-accent btn"
                onClick={() => router.push("#find-club")}
              >
                {t("btn-visitor")}
              </button>
              <button
                className="btn-primary btn"
                onClick={() => router.push("/manager")}
              >
                {t("btn-manager")}
              </button>
              <button
                className="btn-secondary btn"
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
            <div className="flex flex-col items-center gap-4">
              <div className="w-full max-w-sm text-start">
                <AddressSearch
                  label={t("my-address")}
                  onSearch={(adr) => setMyAddress(adr)}
                  defaultAddress={myAddress.address}
                  className="w-full"
                />
              </div>
              <div className="grid w-full max-w-sm grid-flow-col gap-4 text-start">
                <label>{t("search-radius")}</label>
                <div className="input-group">
                  <input
                    type="number"
                    className="input-bordered input w-full text-end"
                    value={range}
                    onChange={(e) => setRange(e.target.valueAsNumber)}
                  />
                  <span>Km</span>
                </div>
              </div>
              <button className="btn-primary btn flex items-center gap-4">
                {t("search-club")}
                <i className="bx bx-search bx-xs" />
              </button>
              <div className="mt-8 max-h-60 w-full border border-primary">
                <table className="table-zebra table w-full">
                  <thead>
                    <tr>
                      <th>{t("club")}</th>
                      <th>{t("distance")}</th>
                      <th>{t("activities")}</th>
                      <th>{t("page")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clubSearch.data?.map((res) => (
                      <tr key={res.name}>
                        <td>{res.name}</td>
                        <td>{/*res.distance*/ "(tbd)"}&nbsp;km</td>
                        <td>
                          <div className="flex flex-wrap gap-1">
                            {getGroups(res).map((g) => (
                              <span key={g} className="pill pill-xs">
                                {g}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          {res.pages.find((p) => p.target === "HOME")
                            ?.published ? (
                            <Link
                              href={`/presentation-page/club/${res.id}/${
                                res.pages.find((p) => p.target === "HOME")?.id
                              }`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <ButtonIcon
                                title={t("page-club", { name: res.name })}
                                iconComponent={
                                  <i className="bx bx-link-external bx-xs" />
                                }
                                buttonSize="xs"
                                buttonVariant="Icon-Outlined-Primary"
                              />
                            </Link>
                          ) : (
                            <span>&nbsp;</span>
                          )}
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
                  initialViewState={{ zoom: 12 }}
                  style={{ width: "100%", height: "100%" }}
                  mapStyle="mapbox://styles/mapbox/streets-v9"
                  mapboxAccessToken={env.NEXT_PUBLIC_MAPBOX_TOKEN}
                  attributionControl={false}
                  longitude={myAddress.lng}
                  latitude={myAddress.lat}
                >
                  <Source type="geojson" data={circle}>
                    <Layer
                      type="fill"
                      paint={{
                        "fill-color": hslToHex(theme, "--p"),
                        "fill-opacity": 0.2,
                      }}
                    />
                    <Layer
                      type="line"
                      paint={{
                        "line-color": hslToHex(theme, "--p"),
                        "line-opacity": 1,
                        "line-width": 2,
                      }}
                    />
                  </Source>
                </Map>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="find-coach" className="bg-base-100">
        <div className="container mx-auto p-4">
          <h2>{t("find-coach")}</h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="flex flex-col items-center gap-4">
              <div className="w-full max-w-sm text-start">
                <AddressSearch
                  label={t("my-address")}
                  onSearch={(adr) => setMyAddress(adr)}
                  defaultAddress={myAddress.address}
                  className="w-full"
                />
              </div>
              <div className="grid w-full max-w-sm grid-flow-col gap-4 text-start">
                <label>{t("search-radius")}</label>
                <div className="input-group">
                  <input
                    type="number"
                    className="input-bordered input w-full text-end"
                    value={range}
                    onChange={(e) => setRange(e.target.valueAsNumber)}
                  />
                  <span>Km</span>
                </div>
              </div>
              <button className="btn-primary btn flex items-center gap-4">
                {t("search-coach")}
                <i className="bx bx-search bx-xs" />
              </button>
              <div className="mt-8 max-h-60 w-full border border-primary">
                <table className="table-zebra table w-full">
                  <thead>
                    <tr>
                      <th>{t("coach")}</th>
                      <th>{t("distance")}</th>
                      <th>{t("rating")}</th>
                      <th>{t("certifications")}</th>
                      <th>{t("page")}</th>
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
                        <td>
                          <div className="flex flex-wrap gap-1">
                            {res.certifications.length ? (
                              res.certifications.map((cert) => (
                                <span key={cert.id} className="pill pill-xs">
                                  {cert.name}
                                </span>
                              ))
                            ) : (
                              <span>&nbsp;</span>
                            )}
                          </div>
                        </td>
                        <td>
                          {res.page?.published ? (
                            <Link
                              href={`/presentation-page/coach/${res.id}/${res.page.id}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <ButtonIcon
                                title={t("page-coach", { name: res.name })}
                                iconComponent={
                                  <i className="bx bx-link-external bx-xs" />
                                }
                                buttonSize="xs"
                                buttonVariant="Icon-Outlined-Primary"
                              />
                            </Link>
                          ) : (
                            <span>&nbsp;</span>
                          )}
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
                  initialViewState={{ zoom: 12 }}
                  style={{ width: "100%", height: "100%" }}
                  mapStyle="mapbox://styles/mapbox/streets-v9"
                  mapboxAccessToken={env.NEXT_PUBLIC_MAPBOX_TOKEN}
                  attributionControl={false}
                  longitude={myAddress.lng}
                  latitude={myAddress.lat}
                >
                  <Source type="geojson" data={circle}>
                    <Layer
                      type="fill"
                      paint={{
                        "fill-color": hslToHex(theme, "--p"),
                        "fill-opacity": 0.2,
                      }}
                    />
                    <Layer
                      type="line"
                      paint={{
                        "line-color": hslToHex(theme, "--p"),
                        "line-opacity": 1,
                        "line-width": 2,
                      }}
                    />
                  </Source>
                </Map>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Home;

export const getStaticProps = async () => {
  return {
    props: {
      ...(await serverSideTranslations(
        "fr",
        ["common", "home"],
        nextI18nConfig
      )),
    },
  };
};
