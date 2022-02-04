import React, { useState } from "react";
import styled from "styled-components";
import data from "./data.json";
import routes from "./routes.json";

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
  top: 0;
  left: 0;
`;

const Select = styled.select`
  height: 64px;
`;

const colorExpression = [
  "case",
  ["in", ["get", "ref"], ["literal", ["5", "9", "16", "18", "19", "66"]]],
  "#404040",
  ["in", ["get", "ref"], ["literal", ["61", "63", "75"]]],
  "#1A559B",
  ["in", ["get", "ref"], ["literal", ["6", "7", "10", "11", "14", "15"]]],
  "#F26532",
  "#404040",
];

function App() {
  const [selected, setSelected] = useState<string>("5");
  const windowSize = useWindow();

  const [viewport, setViewport] = useState<Viewport>({
    longitude: -75.69055,
    latitude: 45.40638,
    zoom: 12.5,
  });

  const handleViewportChange = (v: Viewport) => {
    setViewport(v);
  };

  return (
    <Container>
      <MapGL
        style={{ width: windowSize[0], height: windowSize[1] }}
        mapStyle={"mapbox://styles/mapbox/light-v10"}
        accessToken={process.env.REACT_APP_MAPBOX_KEY}
        hash={true}
        onViewportChange={handleViewportChange}
        {...viewport}
        attributionControl={false}
      >
        <AttributionControl
          compact={false}
          position="bottom-right"
          customAttribution={`Updated on ${new Date(buildDate).toLocaleDateString()}`}
        />
        <NavigationControl showCompass showZoom position="bottom-right" />
        <Source id="routes" type="geojson" data={data as FeatureCollection} />
        <Layer
          id="route-lines"
          type="line"
          source="routes"
          filter={["all", ["==", ["get", "ref"], selected], ["get", "active"]]}
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
          filter={[
            "all",
            ["==", ["get", "ref"], selected],
            ["!", ["get", "active"]],
          ]}
          layout={{
            "line-cap": "round",
          }}
          paint={{
            "line-width": 3,
            "line-opacity": 0.5,
            "line-dasharray": [1, 2],
            "line-color": colorExpression as any,
          }}
        />
      </MapGL>
      <Overlay>
        <Select onChange={(e) => setSelected(e.target.value)}>
          {routes.routes.map((route) => (
            <option value={route.ref}>{route.name}</option>
          ))}
        </Select>
      </Overlay>
    </Container>
  );
}

export default App;
