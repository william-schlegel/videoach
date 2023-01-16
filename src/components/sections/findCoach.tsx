import { LATITUDE, LONGITUDE } from "@lib/defaultValues";
import { trpc } from "@trpcclient/trpc";
import AddressSearch, { type AddressData } from "@ui/addressSearch";
import { useTranslation } from "next-i18next";
import { useMemo, useState } from "react";
import turfCircle from "@turf/circle";
import Link from "next/link";
import ButtonIcon from "@ui/buttonIcon";
import Map, { Layer, Source } from "react-map-gl";
import { env } from "@root/src/env/client.mjs";
import hslToHex from "@lib/hslToHex";
import useLocalStorage from "@lib/useLocalstorage";
import { type TThemes } from "../themeSelector";
import Rating from "@ui/rating";

// type CoachSearchResult = {
//   image: string;
//   rating: number;
//   name: string;
//   distance: number;
//   certifications: string[];
// };

type FindCoachProps = {
  onSelect?: (id: string) => void;
};

function FindCoach({ onSelect }: FindCoachProps) {
  const { t } = useTranslation("home");
  const [myAddress, setMyAddress] = useState<AddressData>({
    address: "",
    lat: LATITUDE,
    lng: LONGITUDE,
  });
  const [range, setRange] = useState(10);
  const coachSearch = trpc.coachs.getAllCoachs.useQuery();
  const [theme] = useLocalStorage<TThemes>("theme", "cupcake");

  const circle = useMemo(() => {
    const center = [myAddress.lng ?? LONGITUDE, myAddress.lat ?? LATITUDE];
    const c = turfCircle(center, range ?? 10, {
      steps: 64,
      units: "kilometers",
      properties: {},
    });
    return c;
  }, [myAddress.lat, myAddress.lng, range]);
  const withSelect = typeof onSelect === "function";

  return (
    <div className="grid grid-cols-1 gap-4 @3xl:grid-cols-2">
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
                {withSelect ? <th>{t("select")}</th> : null}
              </tr>
            </thead>
            <tbody>
              {coachSearch.data?.map((res) => (
                <tr key={res.name}>
                  <td>{res.name}</td>
                  <td>{/*res.distance*/ "(tbd)"}&nbsp;km</td>
                  <td>
                    <Rating note={res.coachData?.rating ?? 0} />
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {res.coachData?.certifications.length ? (
                        res.coachData?.certifications.map((cert) => (
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
                    {res?.coachData?.page?.published ? (
                      <Link
                        href={`/presentation-page/coach/${res.id}/${res.coachData?.page.id}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <ButtonIcon
                          title={t("page-coach", { name: res.name })}
                          iconComponent={
                            <i className="bx bx-link-external bx-xs" />
                          }
                          buttonSize="sm"
                          buttonVariant="Icon-Outlined-Primary"
                        />
                      </Link>
                    ) : (
                      <span>&nbsp;</span>
                    )}
                  </td>
                  {withSelect ? (
                    <td>
                      <span
                        className="btn-primary btn-xs btn"
                        tabIndex={0}
                        onClick={() => onSelect(res.id)}
                      >
                        {t("select")}
                      </span>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="min-h-[30vh]">
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
export default FindCoach;
