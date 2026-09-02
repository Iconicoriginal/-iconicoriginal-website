"""Build the self-hosted SVG boundary layers used by the home project map.

Usage:
  python tools/build-project-map.py countries.geojson regions.geojson italy-provinces.geojson

Sources: Natural Earth Admin 0 (1:50m) and Admin 1 (1:10m), public domain.
"""
from __future__ import annotations

import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "data" / "iconic-project-map.svg"
WIDTH, HEIGHT = 1600, 980
LON_MIN, LON_MAX = -12.0, 37.0
LAT_MIN, LAT_MAX = 29.0, 72.0


def mercator(lat: float) -> float:
    lat = max(-85.0, min(85.0, lat))
    return math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))


MY_MIN, MY_MAX = mercator(LAT_MIN), mercator(LAT_MAX)


def project(point):
    lon, lat = point[:2]
    x = (lon - LON_MIN) / (LON_MAX - LON_MIN) * WIDTH
    y = (MY_MAX - mercator(lat)) / (MY_MAX - MY_MIN) * HEIGHT
    return x, y


def perpendicular_distance(point, start, end):
    x, y = point
    x1, y1 = start
    x2, y2 = end
    if x1 == x2 and y1 == y2:
        return math.hypot(x - x1, y - y1)
    return abs((y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1) / math.hypot(y2 - y1, x2 - x1)


def simplify(points, tolerance):
    if len(points) < 3:
        return points
    first, last = points[0], points[-1]
    index, distance = 0, 0.0
    for i in range(1, len(points) - 1):
        current = perpendicular_distance(points[i], first, last)
        if current > distance:
            index, distance = i, current
    if distance > tolerance:
        left = simplify(points[: index + 1], tolerance)
        right = simplify(points[index:], tolerance)
        return left[:-1] + right
    return [first, last]


def rings(geometry):
    if not geometry:
        return []
    if geometry["type"] == "Polygon":
        return geometry["coordinates"]
    if geometry["type"] == "MultiPolygon":
        return [ring for polygon in geometry["coordinates"] for ring in polygon]
    return []


def path_data(geometry, tolerance):
    chunks = []
    for ring in rings(geometry):
        projected = [project(point) for point in ring]
        if len(projected) < 3:
            continue
        xs = [p[0] for p in projected]
        ys = [p[1] for p in projected]
        if max(xs) < -40 or min(xs) > WIDTH + 40 or max(ys) < -40 or min(ys) > HEIGHT + 40:
            continue
        clean = simplify(projected, tolerance)
        if len(clean) < 3:
            continue
        chunks.append("M" + "L".join(f"{x:.1f},{y:.1f}" for x, y in clean) + "Z")
    return "".join(chunks)


def esc(value):
    return str(value).replace("&", "&amp;").replace('"', "&quot;").replace("<", "&lt;")


def main():
    if len(sys.argv) != 4:
        raise SystemExit("Pass Admin 0, Admin 1 and Italy province GeoJSON paths")
    countries = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))["features"]
    regions = json.loads(Path(sys.argv[2]).read_text(encoding="utf-8"))["features"]
    provinces = json.loads(Path(sys.argv[3]).read_text(encoding="utf-8"))["features"]
    selected = {
        f["properties"].get("ADM0_A3")
        for f in countries
        if f["properties"].get("CONTINENT") == "Europe"
    } | {"CYP", "ISR", "TUR"}

    country_paths = []
    for feature in countries:
        props = feature["properties"]
        iso = props.get("ADM0_A3")
        if iso not in selected:
            continue
        d = path_data(feature.get("geometry"), 0.7)
        if not d:
            continue
        tone = int(props.get("MAPCOLOR7") or 1)
        country_paths.append(
            f'<path class="project-map-country tone-{tone}" data-iso="{esc(iso)}" '
            f'aria-label="{esc(props.get("ADMIN") or iso)}" d="{d}"/>'
        )

    region_paths = []
    for feature in regions:
        props = feature["properties"]
        if props.get("adm0_a3") not in selected:
            continue
        d = path_data(feature.get("geometry"), 1.1)
        if not d:
            continue
        region_paths.append(
            f'<path class="project-map-region" data-parent="{esc(props.get("adm0_a3"))}" '
            f'aria-label="{esc(props.get("name_en") or props.get("name") or "")}" d="{d}"/>'
        )

    province_paths = []
    for feature in provinces:
        props = feature["properties"]
        d = path_data(feature.get("geometry"), 0.55)
        if not d:
            continue
        province_paths.append(
            f'<path class="project-map-province" aria-label="{esc(props.get("shapeName") or "")}" d="{d}"/>'
        )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        '\n'.join([
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {WIDTH} {HEIGHT}" role="img" aria-labelledby="map-title map-desc" data-bounds="{LON_MIN} {LAT_MIN} {LON_MAX} {LAT_MAX}">',
            '<title id="map-title">Mappa dei progetti Iconic Original</title>',
            '<desc id="map-desc">Mappa interattiva d’Europa e del Mediterraneo con confini nazionali, regionali e sedi dei progetti.</desc>',
            '<g class="project-map-camera">',
            f'<rect class="project-map-water" x="0" y="0" width="{WIDTH}" height="{HEIGHT}"/>',
            '<g class="project-map-geography" transform="translate(176 0) scale(.78 1)">',
            '<g class="project-map-countries">', *country_paths, '</g>',
            '<g class="project-map-regions">', *region_paths, '</g>',
            '<g class="project-map-provinces">', *province_paths, '</g>',
            '<g class="project-map-markers"></g>',
            '</g>',
            '</g></svg>'
        ]), encoding="utf-8"
    )
    print(f"wrote {OUT.relative_to(ROOT)}: {len(country_paths)} countries, {len(region_paths)} regions, {len(province_paths)} Italian provinces")


if __name__ == "__main__":
    main()
