async function initMap() {
    const { Map } = await google.maps.importLibrary("maps");

    createMap = (pos, zoom = 4) => {
        map = new Map(document.getElementById("map"), {
            center: pos,
            mapId: "Track-Map",
            zoom: zoom,
        });
    }

    try {
        const pos = await getUserLocation();
        createMap(pos, 8);

    } catch (error) {
        console.error("Error fetching user's location:", error.message);
        const pos = { lat: 39.84181336054336, lng: -99.90822182318774 }; // Center of USA as default map center
        createMap(pos, 4);
    }

    await parseCsv();
}


async function main() { // Entry point

    createDocumentListeners();
    defineCustomElements();
    await initMap();
    generateCardInfoAndClickListeners(); // Creates objects to populate the card data

    const trackCards = document.querySelectorAll('track-card');
    google.maps.event.addListener(map, 'bounds_changed', () => {
        trackCards.forEach(track => {
            if (map.getBounds().contains(track.marker.getPosition())) {
                track.style.display = 'block';
            } else {
                track.style.display = 'none';
            }
        });
    });
}



main(); // Entry point

