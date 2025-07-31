import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";

const Map = () => {
  const mapContainer = useRef(null);
  const [schools, setSchools] = useState(null);

  const [operator_type, setOperatorType] = useState("all");

  useEffect(() => {
    // Initialize the map (your existing code)

    const queryOperatorType = operator_type === "all" ? "" : operator_type;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style:
        "https://api.baato.io/api/v1/styles/breeze?key=bpk.JE_dkwVoO0-gxmb0hIQqHk16iLXJYJP36FACiJEbVltr",
      center: [85.324, 27.7172],
      zoom: 12,
    });

    // Fetch schools data from Overpass API
    const overpassQuery = `[out:json][timeout:25];
(
  nwr["amenity"="school"]["operator:type"=${queryOperatorType}](27.65, 85.25, 27.78, 85.37);
);
out center;`;

    fetch(
      `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(
        overpassQuery
      )}`
    )
      .then((res) => res.json())
      .then((data) => {
        const cleanSchools = data.elements
          .filter((el) => {
            return (
              (el.type === "node" && el.lat && el.lon) ||
              (el.center && el.center.lat && el.center.lon)
            );
          })
          .map((el) => {
            const lat = el.type === "node" ? el.lat : el.center.lat;
            const lon = el.type === "node" ? el.lon : el.center.lon;
            return {
              id: el.id,
              type: el.type,
              name: el.tags?.name || "Unnamed School",
              lat,
              lon,
            };
          });

        console.log("Cleaned schools:", cleanSchools);
        setSchools(cleanSchools);

        // === NEW: Add markers for each school ===
        cleanSchools.forEach(({ lat, lon, name }) => {
          new maplibregl.Marker({ color: "#FF5733" }) // red marker
            .setLngLat([lon, lat])
            .setPopup(new maplibregl.Popup().setText(name)) // popup shows school name
            .addTo(map);
        });
        // === End new marker code ===
      })
      .catch((err) => console.error("Fetch error:", err));

    return () => map.remove();
  }, [operator_type]);

  // === UPDATED RETURN JSX to add total schools count below map ===
  return (
    <>
      <select
        value={operator_type}
        onChange={(e) => setOperatorType(e.target.value)}
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          zIndex: 1000,
          padding: "6px 12px",
          borderRadius: "4px",
        }}
      >
        <option value="private">Private</option>
        <option value="government">Government</option>
        <option value="all">All</option>
      </select>
      <div ref={mapContainer} style={{ width: "100%", height: "500px" }} />
      <div style={{ padding: "10px", fontSize: "16px" }}>
        {schools
          ? `Total schools found: ${schools.length}`
          : "Loading schools..."}
      </div>
    </>
  );
};

export default Map;
