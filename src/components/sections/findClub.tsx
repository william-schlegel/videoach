import { LATITUDE, LONGITUDE } from "@lib/defaultValues";
import { trpc } from "@trpcclient/trpc";
import AddressSearch, { type AddressData } from "@ui/addressSearch";
import { useTranslation } from "next-i18next";
import { useEffect, useMemo, useState } from "react";
import turfCircle from "@turf/circle";
import Link from "next/link";
import ButtonIcon from "@ui/buttonIcon";
import Map, { Layer, Source } from "react-map-gl";
import { env } from "@root/src/env/client.mjs";
import hslToHex from "@lib/hslToHex";
import useLocalStorage from "@lib/useLocalstorage";
import { type TThemes } from "../themeSelector";

// type ClubSearchResult = {
//   name: string;
//   distance: number;
//   activities: string[];
// };

type FindClubProps = {
  address?: string;
};

function FindClub({ address = "" }: FindClubProps) {
  const { t } = useTranslation("home");
  const [myAddress, setMyAddress] = useState<AddressData>({
    address,
    lat: LATITUDE,
    lng: LONGITUDE,
  });
  const [range, setRange] = useState(10);
  // const [clubSearch, setClubSearch] = useState<ClubSearchResult[]>([]);
  const clubSearch = trpc.clubs.getAllClubs.useQuery();
  const [theme] = useLocalStorage<TThemes>("theme", "cupcake");

  useEffect(
    () =>
      setMyAddress({
        address,
        lat: LATITUDE,
        lng: LONGITUDE,
      }),
    [address]
  );

  type clubItem = typeof clubSearch.data extends (infer U)[] | undefined
    ? U
    : never;

  function getGroups(club: clubItem) {
    const grps = club.activities.map((a) => a.group.name).flat();
    const set = new Set(grps);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }
  const circle = useMemo(() => {
    const center = [myAddress.lng ?? LONGITUDE, myAddress.lat ?? LATITUDE];
    const c = turfCircle(center, range ?? 10, {
      steps: 64,
      units: "kilometers",
      properties: {},
    });
    return c;
  }, [myAddress.lat, myAddress.lng, range]);

  return (
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
                    {res.pages.find((p) => p.target === "HOME")?.published ? (
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
            initialViewState={{ zoom: 9 }}
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
  );
}
export default FindClub;
