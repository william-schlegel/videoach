import { LATITUDE, LONGITUDE } from "@lib/defaultValues";
import { trpc } from "@trpcclient/trpc";
import AddressSearch, { type AddressData } from "@ui/addressSearch";
import { useTranslation } from "next-i18next";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import turfCircle from "@turf/circle";
import Link from "next/link";
import ButtonIcon from "@ui/buttonIcon";
import Map, { Layer, Marker, Source, useMap } from "react-map-gl";
import { env } from "@root/src/env/client.mjs";
import hslToHex from "@lib/hslToHex";
import useLocalStorage from "@lib/useLocalstorage";
import { type TThemes } from "../themeSelector";
import Rating from "@ui/rating";
import { useHover } from "@lib/useHover";

type FindCoachProps = {
  address?: string;
  onSelect?: (id: string) => void;
};

function FindCoach({ address = "", onSelect }: FindCoachProps) {
  const { t } = useTranslation("home");
  const [myAddress, setMyAddress] = useState<AddressData>({
    address: "",
    lat: LATITUDE,
    lng: LONGITUDE,
  });
  const [range, setRange] = useState(10);
  const [hoveredId, setHoveredId] = useState("");
  const coachSearch = trpc.coachs.getCoachsFromDistance.useQuery(
    {
      locationLat: myAddress.lat,
      locationLng: myAddress.lng,
      range,
    },
    { enabled: false }
  );
  const [theme] = useLocalStorage<TThemes>("theme", "cupcake");

  type TCoachItem = typeof coachSearch.data extends (infer U)[] | undefined
    ? U
    : never;
  const handleSearch = () => coachSearch.refetch();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const map = useMap();
  const handleResize = useCallback(() => {
    if (map.current) map.current.resize();
  }, [map]);

  useEffect(() => {
    if (mapContainerRef.current)
      new ResizeObserver(handleResize).observe(mapContainerRef.current);
  }, [handleResize]);

  useEffect(() => {
    setMyAddress({
      address,
      lat: LATITUDE,
      lng: LONGITUDE,
    });
    handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);
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

  function CoachRow({
    item,
    onHover,
  }: {
    item: TCoachItem;
    onHover: (id: string) => void;
  }) {
    const ref = useRef<HTMLTableRowElement | null>(null);
    const isHovered = useHover(ref);

    useEffect(() => {
      if (isHovered) onHover(item.id);
    }, [isHovered, onHover, item]);

    return (
      <tr className="hover" ref={ref}>
        <td>{item.publicName}</td>
        <td>{item.distance.toFixed(0)}&nbsp;km</td>
        <td>
          <Rating note={item.rating ?? 0} />
        </td>
        <td>
          <div className="flex flex-wrap gap-1">
            {item.coachingActivities.length ? (
              item.coachingActivities.map((activity) => (
                <span key={activity.id} className="pill pill-xs">
                  {activity.name}
                </span>
              ))
            ) : (
              <span>&nbsp;</span>
            )}
          </div>
        </td>
        <td>
          {item?.page?.published ? (
            <Link
              href={`/presentation-page/coach/${item.id}/${item.page.id}`}
              target="_blank"
              rel="noreferrer"
            >
              <ButtonIcon
                title={t("page-coach", { name: item.publicName })}
                iconComponent={<i className="bx bx-link-external bx-xs" />}
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
              onClick={() => onSelect(item.id)}
            >
              {t("select")}
            </span>
          </td>
        ) : null}
      </tr>
    );
  }

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
        <button
          className="btn-primary btn flex items-center gap-4"
          onClick={() => handleSearch()}
        >
          {t("search-coach")}
          <i className="bx bx-search bx-xs" />
        </button>
        <div className="mt-8 max-h-60 w-full">
          <table className="table-zebra table w-full">
            <thead>
              <tr>
                <th>{t("coach")}</th>
                <th>{t("distance")}</th>
                <th>{t("rating")}</th>
                <th>{t("activities")}</th>
                <th>{t("page")}</th>
                {withSelect ? <th>{t("select")}</th> : null}
              </tr>
            </thead>
            <tbody>
              {coachSearch.data?.map((res) => (
                <CoachRow
                  key={res.id}
                  item={res}
                  onHover={(id) => setHoveredId(id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="min-h-[30vh]">
        <div className="h-full border border-primary" ref={mapContainerRef}>
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
            {coachSearch.data?.map((res) => (
              <Marker
                key={res.id}
                latitude={res.latitude ?? LATITUDE}
                longitude={res.longitude ?? LONGITUDE}
                anchor="bottom"
              >
                <i
                  className={`bx bxs-map bx-md ${
                    res.id === hoveredId ? "text-secondary" : "text-primary"
                  }`}
                />
              </Marker>
            ))}{" "}
          </Map>
        </div>
      </div>
    </div>
  );
}
export default FindCoach;
