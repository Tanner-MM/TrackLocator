let map;
let coordinates = []; // Holds a list of all coordinate pairs for each track
let locations = []; // List of all track names
let parsedData = []; // All csv data, parsedData ;into rows and columns
let markers = []; // All marker objects
let tracks = [];
let infowindow;
const defaultPos = { lat: 39.84181336054336, lng: -99.90822182318774 };


let currentHighlightedCard = null;
let lastOpenedInfoWindow = null;
let markerInfoWindows = {};
let lastAppliedFilter = null;

// Radius search function that gives a list of all entries within the center radius
// let radiusSearchUrl = "https://script.google.com/macros/s/AKfycbxDyE2Ky9w5GA9B8RlBbpew5d6GscF0rjJLR39NIiVGCd3e6WSDjLQir32b818Xy5tD/exec?centerLat=YOUR_LAT&centerLng=YOUR_LNG&radius=YOUR_RADIUS";

async function parseCsv() {
    await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vRHXMq5l0JBWFM7Rohunawo0q6vFnYu24AIBBwgkaycv2LJaFAefYhNwzGMmkWvfKqYODs28EWhD6n3/pub?gid=0&single=true&output=csv', {
        headers: {
            "Cache-Control": "max-age=86400;",
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

            coordinates = parsedData.map(item => [+item[7], +item[8]]); // Omits tracks that do not have coordinates and converts values to a float
            locations = parsedData.map(item => item[0]);
        })
        .catch(err => console.error(err)
        );
}

function generateCardsAndPlaceMarkers() {
    const trackContainer = document.getElementById("track-container");

    // Clear the existing child nodes of the trackContainer
    while (trackContainer.firstChild) {
        trackContainer.removeChild(trackContainer.firstChild);
    }

    tracks.forEach((track, index) => {
        // Generate track card elements
        const trackEl = document.createElement("track-card");
        trackEl.setAttribute('data-name', track.trackName);

        for (let [key, value] of Object.entries(track)) {
            let propEl = document.createElement("span");
            if (value) { // Check for missing value. If falsy, skip it.
                propEl.setAttribute("slot", key);
                propEl.textContent = value;
                trackEl.appendChild(propEl);
            }
        }

        // Place marker on the map and link it to the track card
        let marker = new google.maps.Marker({
            position: new google.maps.LatLng(coordinates[index][0], coordinates[index][1]),
            map: map,
            title: locations[index]
        });
        //   marker.trackCard = trackEl; // Creates a custom property on the marker to link it its corresponding track card
        markers.push(marker);

        createInfoWindow(marker, index); // Create the infowindow for each marker.
        trackContainer.appendChild(trackEl);
        trackEl.marker = marker; // Binds the marker to the track card
    });
}

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

    generateCardsAndPlaceMarkers();
    createClickListeners();
}

async function focusOnMarker(locationId) {
    let trackCard = document.querySelector(`track-card[data-name="${locationId}"]`);

    if (trackCard && trackCard.marker) {
        let marker = trackCard.marker;

        map.setCenter(marker.getPosition(), 1);
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(() => marker.setAnimation(null), 1000); // Bounce animation for 1s to indicate which is selected

        // Open the corresponding infoWindow
        if (markerInfoWindows[locationId]) {
            if (lastOpenedInfoWindow) {
                lastOpenedInfoWindow.close();
            }
            markerInfoWindows[locationId].setContent(marker.get('title'));
            markerInfoWindows[locationId].open(map, marker);
            lastOpenedInfoWindow = markerInfoWindows[locationId];
        }

        trackCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (currentHighlightedCard) {
            currentHighlightedCard.card.classList.remove('highlighted');
        }
        trackCard.card.classList.add('highlighted');
        currentHighlightedCard = trackCard;
    }
}


function createClickListeners() {
    document.querySelectorAll('track-card').forEach(card => {
        card.addEventListener('click', function () {
            let locationId = card.getAttribute('data-name');
            focusOnMarker(locationId);
            // map.setCenter(card.marker.getPosition(), 1);
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

function createDocumentListeners() {
    document.getElementById('autocomplete').addEventListener('input', function () {
        if (this.value) {
            document.getElementById('resetButton').style.display = 'block';
        } else {
            document.getElementById('resetButton').style.display = 'none';
        }
    });

    document.getElementById('resetButton').addEventListener('click', function () {
        const autocompleteInput = document.getElementById('autocomplete');
        autocompleteInput.value = '';
        this.style.display = 'none';
        document.getElementById('no-results-message').style.display = 'none'; // Hide the no locations message if it's shown
    });


    document.addEventListener('DOMContentLoaded', function () {
        map = new google.maps.Map(document.getElementById('map'), {
            center: defaultPos, // Default coordinates
            zoom: 4 // Defualt zoom
        });

        // Initialize the Autocomplete functionality
        const autocomplete = new google.maps.places.Autocomplete(
            (document.getElementById('autocomplete')),
            { types: ['geocode'] }
        );

        // Bind the map's bounds (viewport) property to the autocomplete object,
        // so the autocomplete's boundary is automatically adjusted based on the map's bounds.
        autocomplete.bindTo('bounds', map);

        // Set up the listener for the autocomplete widget
        autocomplete.addListener('place_changed', function () {
            const place = autocomplete.getPlace();

            if (place.geometry) {
                // map.panTo(place.geometry.location);
                map.setCenter(place.geometry.location);
                map.setZoom(_getZoomLevel(place.types));
            } else {
                document.getElementById('autocomplete').placeholder = 'Enter a location';

            }
        });
    });

    document.getElementById('resetMapButton').addEventListener('click', function () {
        if (map.getZoom() == 4) return; // Prevents repeat submissions
        if (map) {
            map.setCenter(defaultPos);
            map.setZoom(4);
        }
    });

    document.getElementById('locationButton').addEventListener('click', async () => {
        try {
            const pos = await getUserLocation();
            map.setCenter(pos);
            map.setZoom(12);
        } catch (error) {
            console.error("Error fetching user's location:", error.message);
            map.setCenter(defaultPos);
            map.setZoom(4);
        }
    });
}

function _getZoomLevel(placeTypes) {
    const zoomLevels = {
        'country': 5,
        'administrative_area_level_1': 6,  // State/Province level
        'administrative_area_level_2': 8,  // County level
        'administrative_area_level_3': 10,
        'locality': 10,                    // City level
        'sublocality': 14,
        'neighborhood': 15,
        'route': 16,                       // Streets in a city
        'street_address': 17,              // Specific address
        'premise': 18,                     // Specific building
        'natural_feature': 10,
        'airport': 13,
        'park': 15,
        'point_of_interest': 16
    };

    let zoom = 12; // Default to a mid-range zoom level
    for (let type of placeTypes) {
        if (zoomLevels[type]) {
            zoom = zoomLevels[type];
            break;  // Use the first matched type to determine zoom
        }
    }

    return zoom;
}

function defineCustomElements() {
    customElements.define(
        "track-card",
        class extends HTMLElement {
            constructor() {
                super();
                const template = document.getElementById("track-card").content;
                const shadowRoot = this.attachShadow({ mode: "open" });
                shadowRoot.appendChild(template.cloneNode(true));

                this._card = shadowRoot.querySelector('.card');
                this._marker = null; // Initially null, set on card creation
                this._websiteContainer = shadowRoot.getElementById('website-link');
                this._facebookContainer = shadowRoot.getElementById('fb-link');
                this._instagramContainer = shadowRoot.getElementById('ig-link');
            }

            get card() {
                return this._card;
            }

            get marker() {
                return this._marker;
            }

            set marker(marker) {
                this._marker = marker;
            }


            connectedCallback() { // Fires when the element is rendered in the template

                // Get the website URL from the slot
                const websiteSlot = this.querySelector('[slot="website"]');
                if (!!websiteSlot) {
                    let websiteSvg = '<svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 640 512"><path d="M579.8 267.7c56.5-56.5 56.5-148 0-204.5c-50-50-128.8-56.5-186.3-15.4l-1.6 1.1c-14.4 10.3-17.7 30.3-7.4 44.6s30.3 17.7 44.6 7.4l1.6-1.1c32.1-22.9 76-19.3 103.8 8.6c31.5 31.5 31.5 82.5 0 114L422.3 334.8c-31.5 31.5-82.5 31.5-114 0c-27.9-27.9-31.5-71.8-8.6-103.8l1.1-1.6c10.3-14.4 6.9-34.4-7.4-44.6s-34.4-6.9-44.6 7.4l-1.1 1.6C206.5 251.2 213 330 263 380c56.5 56.5 148 56.5 204.5 0L579.8 267.7zM60.2 244.3c-56.5 56.5-56.5 148 0 204.5c50 50 128.8 56.5 186.3 15.4l1.6-1.1c14.4-10.3 17.7-30.3 7.4-44.6s-30.3-17.7-44.6-7.4l-1.6 1.1c-32.1 22.9-76 19.3-103.8-8.6C74 372 74 321 105.5 289.5L217.7 177.2c31.5-31.5 82.5-31.5 114 0c27.9 27.9 31.5 71.8 8.6 103.9l-1.1 1.6c-10.3 14.4-6.9 34.4 7.4 44.6s34.4 6.9 44.6-7.4l1.1-1.6C433.5 260.8 427 182 377 132c-56.5-56.5-148-56.5-204.5 0L60.2 244.3z"/></svg>';


                    // Create and inject website icon and give it a link to the url
                    const websiteLink = document.createElement('a');
                    websiteLink.classList.add('website-icon');
                    websiteLink.innerHTML = websiteSvg;
                    this.shadowRoot.appendChild(websiteLink);
                    this._websiteContainer.appendChild(websiteLink);

                    websiteLink.title = 'Visit Website';
                    // Add a click event listener to the website icon
                    websiteLink.addEventListener('click', () => {
                        window.open(websiteSlot.textContent, '_blank');
                    });

                    const cardTitle = this.shadowRoot.getElementById('card-title');
                    if (!!cardTitle) {
                        cardTitle.href = websiteSlot.textContent;
                        cardTitle.title = 'Visit Website';
                        cardTitle.addEventListener('click', () => {
                            window.open(websiteSlot.textContent, '_blank');
                        });
                    }

                    websiteSlot.style.display = 'none'; // Hide the website URL slot content
                }


                // Create and inject facebook icon and give it a link to the url
                const facebookSlot = this.querySelector('[slot="facebook"]');
                if (!!facebookSlot) {
                    let facebookSvg = '<svg xmlns="http://www.w3.org/2000/svg" height="1.25em" viewBox="0 0 512 512"><path d="M504 256C504 119 393 8 256 8S8 119 8 256c0 123.78 90.69 226.38 209.25 245V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.28c-30.8 0-40.41 19.12-40.41 38.73V256h68.78l-11 71.69h-57.78V501C413.31 482.38 504 379.78 504 256z"/></svg>';
                    const facebookLink = document.createElement('a');
                    facebookLink.innerHTML = facebookSvg;
                    this.shadowRoot.appendChild(facebookLink);
                    this._facebookContainer.appendChild(facebookLink);

                    facebookLink.title = 'Visit Facebook Page';
                    facebookLink.addEventListener('click', () => {
                        window.open(facebookSlot.textContent, '_blank');
                    });
                    facebookSlot.style.display = 'none'; // Hide the facebook slot that is generated
                }

                const igSlot = this.querySelector('[slot="instagram"]');
                if (!!igSlot) {
                    let igSvg = '<svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 448 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"/></svg>';
                    const igLink = document.createElement('a');
                    igLink.innerHTML = igSvg;
                    this.shadowRoot.appendChild(igLink);
                    this._instagramContainer.appendChild(igLink);
                    igLink.title = "Visit Instagram Page";
                    igLink.addEventListener('click', () => {
                        window.open(igSlot.textContent, '_blank');
                    })
                    igSlot.style.display = 'none';
                }
            }
        }
    );
}