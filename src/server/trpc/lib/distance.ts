import destination from "@turf/destination";
import { point } from "@turf/helpers";
import { getCoord } from "@turf/invariant";
/**
 * calculate the bounding box arround a point at a certain distance (top left and bottom right)
 * @param originLat latitude
 * @param originLng longitude
 * @param distance distance in km
 */
export function calculateBBox(
  originLng: number,
  originLat: number,
  distance: number
) {
  if (distance <= 0) {
    return [
      [originLng, originLat],
      [originLng, originLat],
    ];
  }
  console.log("originLng :>> ", originLng);
  console.log("originLat :>> ", originLat);
  const halfDistance = (distance / 2) * Math.sqrt(2);
  const org = point([originLng, originLat]);
  const topLeft = destination(org, halfDistance, -45, { units: "kilometers" });
  const bottomRight = destination(org, halfDistance, 135, {
    units: "kilometers",
  });
  return [getCoord(topLeft), getCoord(bottomRight)];
}
