async function main() { // Entry point

    createDocumentListeners();
    defineCustomElements();
    await parseCsv();
    generateCardInfoAndClickListeners(); // Creates objects to populate the card data

    const noResultsMessage = document.getElementById("no-results-message");
    const trackCards = document.querySelectorAll('track-card');
    google.maps.event.addListener(map, 'bounds_changed', () => {
        let isVisible = false;

        trackCards.forEach(track => {
            if (map.getBounds().contains(track.marker.getPosition())) {
                track.style.display = 'block';
                isVisible = true;
            } else {
                track.style.display = 'none';
            }
        });
        noResultsMessage.style.display = isVisible ? 'none' : 'block';
    });

    google.maps.event.addListener(map, 'click', function() {
        if (lastOpenedInfoWindow) {
            lastOpenedInfoWindow.close();
        }
    });
};

main(); // Entry point

