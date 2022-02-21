import React, { useRef, useState } from "react";
import styled from "styled-components";
import data from "./data.json";
import routes from "./routes.json";
import stops from "./stops.json";

import MapGL, {
  Viewport,
  Layer,
  NavigationControl,
  Source,
  AttributionControl,
} from "@urbica/react-map-gl";
import { useWindow } from "./useWindow";
import { FeatureCollection } from "geojson";
import "mapbox-gl/dist/mapbox-gl.css";
import preval from "preval.macro";
import { LngLatBoundsLike, Map as MapboxMap } from "mapbox-gl";
import bbox from "@turf/bbox";

const buildDate = preval`module.exports = new Date()`;

const Container = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
`;

const Overlay = styled.div`
  display: flex;
  overflow: hidden;
  position: absolute;

  @media (max-width: 600px) {
    width: 100%;
  }
`;

const Select = styled.select`
  margin: 1em;
  border-radius: 0.5em;
  border: solid 1px #e7e7e7;
  padding: 0.5em;

  @media (max-width: 600px) {
    width: 100%;
  }
`;

const colorExpression = [
  "case",
  ["in", ["get", "ref"], ["literal", ["1"]]],
  "#D62937",
  ["in", ["get", "ref"], ["literal", ["5", "9", "16", "18", "19", "66"]]],
  "#404040",
  [
    "in",
    ["get", "ref"],
    ["literal", ["61", "63", "75", "N39", "N45", "N57", "N61", "N75", "N97"]],
  ],
  "#1A559B",
  ["in", ["get", "ref"], ["literal", ["6", "7", "10", "11", "14", "15", "85"]]],
  "#F26532",
  ["in", ["get", "ref"], ["literal", ["400"]]],
  "#007E88",
  "#404040",
];

const params = new URLSearchParams(window.location.search);
const defaultRef = params.get("ref");

function App() {
  const [selected, setSelected] = useState<string>(defaultRef ?? "5");
  const windowSize = useWindow();
  const mapRef = useRef<MapGL>(null);

  const [viewport, setViewport] = useState<Viewport>({
    longitude: -75.69055,
    latitude: 45.40638,
    zoom: 12.5,
  });

  const handleViewportChange = (v: Viewport) => {
    setViewport(v);
  };

  let selectedFilter =
    selected === "all"
      ? [
          "any",
          ["==", ["get", "night"], ["literal", null]],
          ["!", ["get", "night"]],
        ]
      : ["==", ["get", "ref"], selected];

  if (selected === "night") {
    selectedFilter = ["get", "night"];
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRef = e.target.value;
    setSelected(newRef);

    const features = data.features.filter((feature) => {
      return (
        feature.properties.ref === newRef &&
        (feature.properties.detour || !feature.properties.active)
      );
    });

    if (features.length === 0) {
      return;
    }

    const featureBbox = bbox({
      type: "FeatureCollection",
      features,
    }) as LngLatBoundsLike;

    const map: MapboxMap | undefined = mapRef.current?.getMap();
    map?.fitBounds(featureBbox, {
      padding: 128,
    });
  };

  return (
    <Container>
      <MapGL
        style={{ width: windowSize[0], height: windowSize[1] }}
        mapStyle={"mapbox://styles/mapbox/light-v10"}
        accessToken={process.env.REACT_APP_MAPBOX_KEY}
        hash={true}
        ref={mapRef}
        onViewportChange={handleViewportChange}
        {...viewport}
        attributionControl={false}
      >
        <AttributionControl
          compact={windowSize[0] <= 600}
          position="bottom-right"
          customAttribution={`Updated at ${new Date(
            buildDate
          ).toLocaleString()}`}
        />
        <NavigationControl showCompass showZoom position="bottom-right" />
        <Source id="routes" type="geojson" data={data as FeatureCollection} />
        <Source id="stops" type="geojson" data={stops as FeatureCollection} />
        <Layer
          id="stops"
          source="stops"
          type="circle"
          minzoom={13}
          paint={{
            "circle-color": "#FF4436",
            "circle-radius": [
              "interpolate",
              ["exponential", 2],
              ["zoom"],
              12,
              1,
              16,
              6,
            ],
          }}
        />
        <Layer
          id="route-lines"
          type="line"
          source="routes"
          filter={["all", selectedFilter, ["get", "active"]]}
          layout={{
            "line-cap": "round",
          }}
          paint={{
            "line-width": 5,
            "line-color": colorExpression as any,
          }}
        />
        <Layer
          id="route-lines-inactive"
          type="line"
          source="routes"
          filter={["all", selectedFilter, ["!", ["get", "active"]]]}
          layout={{
            "line-cap": "round",
          }}
          paint={{
            "line-width": 3,
            "line-opacity": 0.3,
            "line-dasharray": [1, 2],
            "line-color": colorExpression as any,
          }}
        />
      </MapGL>
      <Overlay>
        <Select value={selected} onChange={handleChange}>
          {routes.groups.map((group) => (
            <optgroup key={group.title} label={group.title}>
              {group.routes.map((route) => (
                <option value={route.ref} key={route.ref}>
                  {route.name}
                </option>
              ))}
            </optgroup>
          ))}
        </Select>
      </Overlay>
    </Container>
  );
}

export default App;
