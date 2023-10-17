let map;
let coordinates = []; // Holds a list of all coordinate pairs for each track
let locations = []; // List of all track names
let parsedData = []; // All csv data, parsedData ;into rows and columns
let markers = []; // All marker objects
let tracks = [];
let infowindow;

let currentHighlightedCard = null;
let lastOpenedInfoWindow = null;
let markerInfoWindows = {};
let lastAppliedFilter = null;

// Radius search function that gives a list of all entries within the center radius
// let radiusSearchUrl = "https://script.google.com/macros/s/AKfycbxDyE2Ky9w5GA9B8RlBbpew5d6GscF0rjJLR39NIiVGCd3e6WSDjLQir32b818Xy5tD/exec?centerLat=YOUR_LAT&centerLng=YOUR_LNG&radius=YOUR_RADIUS";

async function parseCsv() {
    await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vRHXMq5l0JBWFM7Rohunawo0q6vFnYu24AIBBwgkaycv2LJaFAefYhNwzGMmkWvfKqYODs28EWhD6n3/pub?gid=0&single=true&output=csv', {
        headers: {
            "Cache-Control": "no-cache"
        }
    })
        .then(res => res.text())
        .then(data => {
            let rows = data.split('\n').map(row => row.trim()).filter(row => row.length); // Splits each row into its own element, trims whitespace, and filters any empty rows
            parsedData = rows.slice(1).map(row => {
                const columns = row.split(',');
                return columns.map(column =>
                    column.replace(/^"|"$/g, '') // Replaces temp % characters in csv with commas, resulting in a full form address
                );
            });

            console.log(parsedData)

            coordinates = parsedData.filter(item => item[7] !== 'null' && item[8] !== 'null').map(item => [+item[7], +item[8]]); // Omits tracks that do not have coordinates and converts values to a float
            locations = parsedData.map(item => item[0]);
        })
        .catch(err => console.error(err)
        );
}

async function placeMarkers() {
    coordinates.map((coordinate, i) => {
        let marker = new google.maps.Marker({
            position: new google.maps.LatLng(coordinate[0], coordinate[1]),
            map: map,
            title: locations[i]
        });
        markers.push(marker);
        createInfoWindow(marker, i);
    });
}
/*
async function placeMarkers(applyFilters = true) {
    // ... your existing code

    if (applyFilters) {
        // Apply the radius filter or any other filters
    }

    // ... rest of your code
}

*/

function createInfoWindow(marker, index) {
    infowindow = new google.maps.InfoWindow({
        content: `locations`[index]
    });

    google.maps.event.addListener(marker, 'click', function () {
        if (lastOpenedInfoWindow)
            lastOpenedInfoWindow.close();

        infowindow.open(map, marker);
        lastOpenedInfoWindow = infowindow;
    });
}

function generateCardInfoAndClickListeners() {
    tracks = parsedData.map((row, i) => ({
        id: i.toString(),
        trackName: row[0],
        address: row[6],
        email: row[10],
        website: row[11],
        facebook: row[12],
        instagram: row[13],
        phoneNumber: row[9],
        coordinates: {
            lat: row[7],
            lng: row[8]
        }
    }));

    generateCards(tracks); // Generates the info card elements
    createClickListeners();
}

function generateCards(tracks) {
    const trackContainer = document.getElementById("track-container");

    while (trackContainer.firstChild) {
        trackContainer.removeChild(trackContainer.firstChild);
    }

    tracks.forEach(track => {
        const trackEl = document.createElement("track-card");
        trackEl.setAttribute('data-name', track.trackName);
        for (let [key, value] of Object.entries(track)) {
            let propEl = document.createElement("span");
            if (!!value) { // Check for missing value. If falsy, skip it.
                propEl.setAttribute("slot", key);
                propEl.textContent = value;
                trackEl.appendChild(propEl);
            }
        }

        trackContainer.appendChild(trackEl);
    });
}

async function focusOnMarker(locationId) {
    for (let marker of markers) {
        if (marker.get('title') === locationId) {
            map.setCenter(marker.getPosition(), 1);
            marker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(() => marker.setAnimation(null), 1000); // Bounce animation for 1s to indicate which is selected

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
        marker.addListener('click', function () {
            let locationId = marker.get('title');
            focusOnMarker(locationId);
        });
        markerInfoWindows[marker.get('title')] = infowindow;
    }
}

function haversineDistance(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the Earth in kilometers
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLon = (lon2 - lon1) * Math.PI / 180;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
}

function filterByRadius(starterLocation = { lat, lng }, radius) {
    const visibleTracks = tracks.filter(track => {
        const distance = haversineDistance(
            starterLocation.lat, starterLocation.lng,
            track.coordinates.lat, track.coordinates.lng
        );
        return distance <= radius;
    });

    // Hide or show markers based on the filtered tracks
    for (let marker of markers) {
        if (visibleTracks.some(track => track.trackName === marker.get('title'))) {
            marker.setMap(map);
        } else {
            marker.setMap(null);
        }
    }


    // Hide or show track cards based on the filtered tracks
    let cards = document.querySelectorAll('track-card');
    for (let card of cards) {
        if (visibleTracks.some(track => track.trackName === card.getAttribute('data-name'))) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    }


    return visibleTracks;
}

function applyRadiusFilter() {
    const radiusDropdown = document.getElementById("radius-search");
    const selectedValue = radiusDropdown.options[radiusDropdown.selectedIndex].value;

    if (lastAppliedFilter == selectedValue) return;

    // If "all" is selected, refresh the map to show all locations and return
    if (selectedValue === "all") {
        refreshMapWithAllLocations();
        lastAppliedFilter = "all";
        return;
    }

    const radius = parseFloat(selectedValue);
    const center = map.getCenter();
    const starterLocation = { lat: center.lat(), lng: center.lng() };

    // Filter tracks based on the radius
    const filteredTracks = filterByRadius(starterLocation, radius);

    // Update the UI based on the filtered tracks
    updateUIForFilteredTracks(filteredTracks);
    lastAppliedFilter = selectedValue;
}


async function updateUIForFilteredTracks(filteredTracks) {
    // Hide all markers and track cards initially
    
    for (let marker of markers) {
        marker.setMap(null);
    }
    let cards = document.querySelectorAll('track-card');
    for (let card of cards) {
        card.style.display = 'none';
    }
    const noResultsMessage = document.getElementById("no-results-message");

    if (filteredTracks.length === 0) {
        // If no tracks are found, display the message and return
        noResultsMessage.style.display = 'block';
        noResultsMessage.style.color = 'white';
        return;
    } else {
        // If tracks are found, hide the message and continue
        noResultsMessage.style.display = 'none';
    }

    // Show markers and track cards that are within the radius
    for (let track of filteredTracks) {
        const marker = markers[locations.indexOf(track.trackName)];
        if (marker) marker.setMap(map);
    
        const trackCard = document.querySelector(`track-card[data-name="${track.trackName}"]`);
        if (trackCard) {
            trackCard.style.display = '';
        }
    }
    
}

function getUserLocation() {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            }, error => {
                reject(error);
            });
        } else {
            reject(new Error("Geolocation is not supported by this browser."));
        }
    });
}


function removeFilters() {
    const noResultsMessage = document.getElementById("no-results-message");
    noResultsMessage.style.display = 'none';
    const radiusDropdown = document.getElementById("radius-search");
    const currentValue = radiusDropdown.value;

    // If the current value is already "all", return early
    if (currentValue === "all" && lastAppliedFilter === null) {
        return; // Prevents repeat submissions
    }

    // Reset the dropdown value to default
    radiusDropdown.value = "all";
    refreshMapWithAllLocations();

    // Reset the last applied filter value
    lastAppliedFilter = null;
}


function refreshMapWithAllLocations() {
    for (let marker of markers) { // Clear existing markers
        marker.setMap(map);
    }

    generateCardInfoAndClickListeners(); // Regenerate the info cards and their event listeners.
}