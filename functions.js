const radiusDropdown = document.getElementById("radius-search");
const noResultsMessage = document.getElementById("no-results-message");
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

// function haversineDistance(lat1, lon1, lat2, lon2) {
//   var R = 6371; // Radius of the Earth in kilometers
//   var dLat = (lat2 - lat1) * Math.PI / 180;
//   var dLon = (lon2 - lon1) * Math.PI / 180;
//   var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//       Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
//       Math.sin(dLon / 2) * Math.sin(dLon / 2);
//   var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c; // Distance in kilometers
// }


// function applyRadiusFilter() {
//   const center = map.getCenter();
//   const starterLocation = { lat: center.lat(), lng: center.lng() };
  
//   const visibleTracks = tracks.filter(track => {
//       const distance = haversineDistance(
//           starterLocation.lat, starterLocation.lng,
//           track.coordinates.lat, track.coordinates.lng
//       );
//       return radiusDropdown.value == "all" || distance <= parseFloat(radiusDropdown.value);
//   });
//   // Hide or show markers based on the filtered tracks
//   for (let marker of markers) {
//       if (visibleTracks.some(track => track.trackName === marker.get('title'))) {
//           marker.setMap(map);
//       } else {
//           marker.setMap(null);
//       }
//   }

//   // Hide or show track cards based on the filtered tracks
//   let cards = document.querySelectorAll('track-card');
//   for (let card of cards) {
//       if (visibleTracks.some(track => track.trackName === card.getAttribute('data-name'))) {
//           card.style.display = 'block';
//       } else {
//           card.style.display = 'none';
//       }
//   }
//   noResultsMessage.style.display = visibleTracks.length == 0 ? 'block' : 'none';
// }


// function removeFilters() {
//   radiusDropdown.value = "all";
//   applyRadiusFilter();
// }

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
    document.getElementById('location-search').addEventListener('input', function () {
        if (this.value) {
            document.getElementById('resetButton').style.display = 'block';
        } else {
            document.getElementById('resetButton').style.display = 'none';
        }
    });

    document.getElementById('resetButton').addEventListener('click', function () {
        const autocompleteInput = document.getElementById('location-search');
        autocompleteInput.value = '';
        this.style.display = 'none';
        document.getElementById('no-results-message').style.display = 'none'; // Hide the no locations message if it's shown
    });


    document.addEventListener('DOMContentLoaded', function () {


        map = new google.maps.Map(document.getElementById('map'), {
            center: { lat: 39.84181336054336, lng: -99.90822182318774 }, // Default coordinates
            zoom: 8
        });

        // Initialize the Autocomplete functionality
        const autocomplete = new google.maps.places.Autocomplete(
            (document.getElementById('location-search')),
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
                document.getElementById('location-search').placeholder = 'Enter a location';

            }
        });
    });
}


function _getZoomLevel(placeTypes) {
    const zoomLevels = {
        'country': 5,
        'administrative_area_level_1': 6,  // State/Province level
        'administrative_area_level_2': 8,  // County level
        'administrative_area_level_3': 10,
        'locality': 12,                    // City level
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
    // Default to a mid-range zoom level
    let zoom = 12;

    for (let type of placeTypes) {
        if (zoomLevels[type]) {
            zoom = zoomLevels[type];
            break;  // Use the first matched type to determine zoom
        }
    }

    return zoom;
}