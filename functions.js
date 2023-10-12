let map;
let coordinates = []; // Holds a list of all coordinate pairs for each track
let locations = []; // List of all track names
let parsedData = []; // All csv data, parsedData ;into rows and columns
let markers = []; // All marker objects
let infowindow;

let currentHighlightedCard = null;
let lastOpenedInfoWindow = null;
let markerInfoWindows = {};

async function parseCsv() {
    await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vRHXMq5l0JBWFM7Rohunawo0q6vFnYu24AIBBwgkaycv2LJaFAefYhNwzGMmkWvfKqYODs28EWhD6n3/pub?gid=0&single=true&output=csv')
        .then(res => res.text())
        .then(data => {
            let rows = data.split('\n').map(row => row.trim()).filter(row => row.length); // Splits each row into its own element, trims whitespace, and filters any empty rows
            parsedData = rows.slice(1).map(row => {
                const columns = row.split(',');
                return columns.map(column =>
                    column.replace(/^"|"$/g, '') // Replaces temp % characters in csv with commas, resulting in a full form address
                );
            });

            // console.log(parsedData);

            // coordinates = parsedData.map(item => [+item[5], +item[6]]); // Includes tracks that have 'null' for the coordinates and stores the values as floats
            coordinates = parsedData.filter(item => item[7] !== 'null' && item[8] !== 'null').map(item => [+item[7], +item[8]]); // Omits tracks that do not have coordinates and converts values to a float

            locations = parsedData.map(item => item[0]);
        })
        .catch(err => console.error(err)
    );
}

async function placeMarkers() {

    coordinates.forEach((coordinate, i) => {
        let marker = new google.maps.Marker({
            position: new google.maps.LatLng(coordinate[0], coordinate[1]),
            map: map,
            title: locations[i],
        });
    
        markers.push(marker);
    
        createInfoWindow(marker, i);
    });
}

function createInfoWindow(marker, index) {
    infowindow = new google.maps.InfoWindow({
        content: locations[index]
    });
    
    google.maps.event.addListener(marker, 'click', function() {
        if (lastOpenedInfoWindow) {
            lastOpenedInfoWindow.close();
        }
        
        infowindow.open(map, marker);
        // setTimeout(() => infowindow.close(), 2000) // Close the info window 
        lastOpenedInfoWindow = infowindow;
    });
}

function generateInfoCards() {
    const tracks = parsedData.map((row, i) => ({
        id: i.toString(),
        trackName: row[0],
        address: row[6],
        email: row[10],
        website: row[11],
        phoneNumber: row[9],
    }));
    generateCardsElements(tracks); // Generates the info card elements
}

function generateCardsElements(tracks) {
    const trackContainer = document.getElementById("track-container");
    tracks.forEach(track => {
        const trackEl = document.createElement("track-card");
        trackEl.setAttribute('data-name', track.trackName);
        for (let [key, value] of Object.entries(track)) {
            let propEl = document.createElement("span");
            propEl.setAttribute("slot", key);
            propEl.textContent = value;
            trackEl.appendChild(propEl);
        }

        trackContainer.appendChild(trackEl);
    });
}

async function focusOnMarker(locationId) {
    for (let marker of markers) {
        if (marker.get('title') === locationId) {
            map.setCenter(marker.getPosition(), 1);
            marker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(() => marker.setAnimation(null), 1000);

            // Open the corresponding infoWindow
            if (markerInfoWindows[locationId]) {
                if (lastOpenedInfoWindow) {
                    lastOpenedInfoWindow.close();
                }
                markerInfoWindows[locationId].setContent(locations[markers.indexOf(marker)]);
                markerInfoWindows[locationId].open(map, marker);
                lastOpenedInfoWindow = markerInfoWindows[locationId];
            }

            let trackCard = document.querySelector(`track-card[data-name="${locationId}"]`);
            if (trackCard) {
                trackCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                if (currentHighlightedCard)
                    currentHighlightedCard.card.classList.remove('highlighted');
                trackCard.card.classList.add('highlighted');
                currentHighlightedCard = trackCard;
            }
        }
    }
}

function createClickListeners() {
    document.querySelectorAll('track-card').forEach(card => {
        card.addEventListener('click', function () {
            let locationId = card.getAttribute('data-name');
            focusOnMarker(locationId);
        });
    });

    // Add click event listeners to markers
    for (let marker of markers) {
        marker.addListener('click', function() {
            let locationId = marker.get('title');
            focusOnMarker(locationId);
        });
        markerInfoWindows[marker.get('title')] = infowindow;
    }
}