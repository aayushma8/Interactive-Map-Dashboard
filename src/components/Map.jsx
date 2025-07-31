import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import "./Map.css";

const Map = () => {
  const mapContainer = useRef(null);
  const [schools, setSchools] = useState(null);
  const [operator_type, setOperatorType] = useState(""); // "" = all schools

  useEffect(() => {
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style:
        "https://api.baato.io/api/v1/styles/breeze?key=bpk.JE_dkwVoO0-gxmb0hIQqHk16iLXJYJP36FACiJEbVltr",
      center: [85.324, 27.7172],
      zoom: 12,
    });

    const overpassQuery = `[out:json][timeout:25];
(
  nwr["amenity"="school"]${
    operator_type ? `["operator:type"="${operator_type}"]` : ""
  }(27.65, 85.25, 27.78, 85.37);
);
out center;`;

    console.log("Overpass Query:", overpassQuery);

    fetch(
      `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(
        overpassQuery
      )}`
    )
      .then((res) => res.json())
      .then((data) => {
        const cleanSchools = data.elements.map((el) => {
          const lat = el.type === "node" ? el.lat : el.center.lat;
          const lon = el.type === "node" ? el.lon : el.center.lon;
          return {
            ...el,
            id: el.id,
            type: el.type,
            name: el.tags?.name || "Unnamed School",
            lat,
            lon,
            tags: el.tags || {},
          };
        });

        setSchools(cleanSchools);

        cleanSchools.forEach(({ lat, lon, name, tags }) => {
          let color = "#FF5733"; // Default (Private)
          if (tags["operator:type"] === "government") color = "#007bff";
          else if (tags["operator:type"] === "public") color = "#28a745";

          new maplibregl.Marker({ color })
            .setLngLat([lon, lat])
            .setPopup(new maplibregl.Popup().setText(name))
            .addTo(map);
        });
      })
      .catch((err) => console.error("Fetch error:", err));

    return () => map.remove();
  }, [operator_type]);

  return (
    <>
      <select
        value={operator_type}
        onChange={(e) => setOperatorType(e.target.value)}
        className="school-dropdown"
      >
        <option value="private">Private</option>
        <option value="government">Government</option>
        <option value="kindergarden">Public</option>
        <option value="">All</option>
      </select>

      <div ref={mapContainer} style={{ width: "100%", height: "500px" }} />

      <div className="school-count">
        {schools
          ? `Total schools found: ${schools.length}`
          : "Loading schools..."}
      </div>
    </>
  );
};

export default Map;
