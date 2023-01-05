import useDebounce from "@lib/useDebounce";
import { env } from "@root/src/env/client.mjs";
import { useEffect, useState } from "react";

type Props = {
  label: string;
  defaultAddress: string;
  className?: string;
  onSearch: (
    lngLat: { longitude: number; latitude: number },
    address: string
  ) => void;
};

type AddressData = {
  lat: number;
  lng: number;
  address: string;
};

const AddressSearch = ({
  defaultAddress,
  label,
  onSearch,
}: // className,
Props) => {
  const [address, setAddress] = useState(defaultAddress);
  const debouncedAddress = useDebounce<string>(address, 500);
  const [addresses, setAddresses] = useState<AddressData[]>([]);

  useEffect(() => {
    if (debouncedAddress) {
      searchAddresses(debouncedAddress).then((found) => setAddresses(found));
    } else setAddresses([]);
  }, [debouncedAddress]);

  function handleSelect(value: string) {
    setAddress(value);
  }

  return (
    <>
      <label className="label"> {label} </label>
      <div className="dropdown-bottom dropdown col-span-2">
        <input
          className="input-bordered input w-full"
          value={address}
          onChange={(e) => handleSelect(e.currentTarget.value)}
          list="addresses"
        />
        {addresses.length > 0 ? (
          <ul className="dropdown-content menu rounded-box w-full bg-base-100 p-2 shadow">
            {addresses.map((adr, idx) => (
              <li key={`ADR-${idx}`}>
                <button
                  type="button"
                  onClick={() =>
                    onSearch(
                      { latitude: adr.lat, longitude: adr.lng },
                      adr.address
                    )
                  }
                >
                  {adr.address}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </>
  );
};

export default AddressSearch;

async function searchAddresses(address: string): Promise<AddressData[]> {
  const url = new URL("http://www.mapquestapi.com/geocoding/v1/address");
  url.searchParams.append("key", env.NEXT_PUBLIC_MAPQUEST_KEY);
  url.searchParams.append("location", address);
  const res = await fetch(url.href);
  const data = await res.json();
  const locations =
    data.results?.[0]?.locations?.map(
      (location: {
        street: string;
        postalCode: string;
        adminArea5: string;
        latLng: { lat: number; lng: number };
      }) => ({
        lat: location.latLng.lat,
        lng: location.latLng.lng,
        address: `${location.street}, ${location.postalCode}, ${location.adminArea5}`,
      })
    ) ?? [];
  return locations;
}
