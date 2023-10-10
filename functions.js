let map;
let coordinates = []; // Holds a list of all coordinate pairs for each track
let locations = []; // List of all track names
let parsedData = []; // All csv data, parsed into rows and columns
let markers = []; // All marker objects
let tracks = [];



async function parseCsv() {
    await fetch('Track-Data.csv')
        .then(res => res.text())
        .then(data => {
            let rows = data.split('\n').map(row => row.trim()).filter(row => row.length); // Splits each row into its own element, trims whitespace, and filters any empty rows
            parsedData = rows.slice(1).map(row => {
                const columns = row.split(',');
                return columns.map(column =>
                    column.replace(/^"|"$/g, '').replace(/%/g, ',') // Replaces temp % characters in csv with commas, resulting in a full form address
                );
            });

            // Parsing the formatted data for the coordinates and 
            // coordinates = parsedData.map(item => [+item[5], +item[6]]); // Includes tracks that have 'null' for the coordinates and stores the values as floats
            coordinates = parsedData.filter(item => item[5] !== 'null' && item[6] !== 'null').map(item => [+item[5], +item[6]]); // Omits tracks that do not have coordinates and converts values to a float

            locations = parsedData.map(item => item[0]);
        })
        .catch(err => console.error(err)
        );
}

async function focusOnMarker(locationId) {
    // Loop through all markers to find the one with the matching 
    for (let marker of markers) {
        if (marker.get('title') === locationId) {
            map.setCenter(marker.getPosition(), 1);

            // Optionally, you can also open an info window or animate the marker here
            marker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(() => marker.setAnimation(null), 1000); // Stop bouncing after 1s
        }
    }
}

async function placeMarkers() {
    let infowindow = new google.maps.InfoWindow({});

    coordinates.forEach((coordinate, i) => {
        let marker = new google.maps.Marker({
            position: new google.maps.LatLng(coordinate[0], coordinate[1]),
            map: map,
            title: locations[i],
        });
    
        markers.push(marker);
    
        google.maps.event.addListener(marker, 'click', function() {
            infowindow.setContent(locations[i]);
            infowindow.open(map, marker);
        });
    });
}

function generateInfoCards() {
    for (let i = 0; i < parsedData.length; i++) {
        const row = parsedData[i];
        const obj = {
            id: i.toString(), // Convert the loop iterator to a string
            trackName: row[0],
            address: row[4],
            email: row[8],
            website: row[9],
            phoneNumber: row[7],
        };
        tracks.push(obj);
    }
    generateCardsElements(); // Generates the info card elements
}

function generateCardsElements() {
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

function createClickListeners() {
    document.querySelectorAll('track-card').forEach(card => {
        card.addEventListener('click', function () {
            let locationId = card.getAttribute('data-name');
            focusOnMarker(locationId);
        });
    });
}
