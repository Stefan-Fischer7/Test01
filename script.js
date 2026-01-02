console.log("Test Projekt Karte: JavaScript läuft");

// Karte an map div binden
const map = L.map("map");

// Start Ansicht und Zoom Level
map.setView([50.5558, 9.6808], 14);

// Kartenbild von OpenStreetMap laden
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap-Mitwirkende',
}).addTo(map);

function formatDistance(meters) {
	if (meters <1000) return `${Math.round(meters)} m`;
	return `${(meters / 1000).toFixed(1)} Km`
}

function updateDistances() {
	if (!userLocation) return;

	for (const s of stations) {
		const meters = map.distance(
			[userLocation.lat, userLocation.lng],
			[s.lat, s.lng]
		);

		const distEl = document.querySelector(`[data-dist-for="${s.name}"]`);
		if (distEl) {
			distEl.textContent = formatDistance(meters);
		}
	}
}

// JSON
let stations = [];

fetch("data/stations.json")
	.then((response) => response.json())
	.then((data) => {
		stations = data;

		addStationsToMap(stations);
		renderStationList(stations);

		if (userLocation) {
			updateDistances();
		}
	})
	.catch((error) => {
		console.error("Fehler beim Laden der Stationsdaten:", error);
	});


// GPS
const locateBtn = document.getElementById("locateBtn");
const statusText = document.getElementById("statusText");


let userMarker = null;
let userLocation = null;

function setStatus(message) {
	statusText.textContent = message;
}

function showUserLocation(lat, lng) {
	if (userMarker) {
		map.removeLayer(userMarker);
	}



userMarker = L.marker([lat, lng]).addTo(map);
//userMarker.bindPopup("Du bist hier 📍").openPopup();

map.setView([lat, lng], 16);
}

locateBtn.addEventListener("click", () => {
	setStatus("Suche deinen Standort...");

	if (!("geolocation" in navigator)) {
		setStatus("GPS ist in diesem Browser nicht verfügbar.");
		return;
	}

	navigator.geolocation.getCurrentPosition(
		(position) => {
			const lat = position.coords.latitude;
			const lng = position.coords.longitude;

			console.log("Standort:", lat, lng);
			setStatus("Standort gefunden ✅");

			userLocation = { lat, lng };
			updateDistances();

			showUserLocation(lat, lng);
		},
		(error) => {
			console.log(error);
			setStatus("Standort nicht verfügbar (Zugriff verweigert oder Signal schlecht.");
		},
		{
			enableHighAccuracy: true,
			timeout: 10000,
			maximumAge: 5000,
		}
	);
});

const stationListEl = document.getElementById("stationList");
const panelHintEl = document.getElementById("panelHint");
const stationMarkers = new Map();

function buildStationPopup(station) {
	let html = `<b>${station.name}</b><br><p>${station.desc}</p>`;

	if (station.image) {
		html +=`
			<img
				src="${station.image}"
				alt="${station.name}"
				class="station-image"
			/>
		`;
	}

	if (station.audio) {
    html += `
      <audio controls style="width:100%; margin-top:8px;">
        <source src="${station.audio}" type="audio/mpeg">
        Dein Browser unterstützt kein Audio.
      </audio>
    `;
  }

  return html;
}

function addStationsToMap(list) {
	for (const s of list) {
		const marker = L.marker([s.lat, s.lng]).addTo(map);
		marker.bindPopup(buildStationPopup(s));
		stationMarkers.set(s, marker);
	}
}

function flyToStation(station) {
	map.flyTo([station.lat, station.lng], 16, { duration: 0.6});

	const marker = stationMarkers.get(station);
	if (marker) {
		marker.openPopup();
	}
}

function renderStationList(list) {
	stationListEl.innerHTML = "";

	for (const s of list) {
		const li = document.createElement("li");
		li.className = "listItem";

const btn = document.createElement("button");
btn.className = "listBtn";
btn.type = "button";

btn.addEventListener("click", () => {
	flyToStation(s);
});

 btn.innerHTML = `
      <div class="itemTop">
        <p class="itemName">${s.name}</p>
        <p class="itemDist" data-dist-for="${s.name}">—</p>
      </div>
      <p class="itemDesc">${s.desc}</p>
    `;

    li.appendChild(btn);
    stationListEl.appendChild(li);
	}
}

addStationsToMap(stations);
renderStationList(stations);