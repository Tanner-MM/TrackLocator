customElements.define(
    "track-card",
    class extends HTMLElement {
      constructor() {
        super();
        const template = document.getElementById(
          "track-card",
        ).content;
        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.appendChild(template.cloneNode(true));
      }
    },
  );
const tracks = [
    {  
        trackName: "BWS Raceway",
        address: "Location A address",
        email: "Email A",
        website: "This is a website for Location A.",
        phoneNumber: "(999) 999-9999",
    },
    {
        trackName: "SHARC",
        address: "Location B address",
        email: "Email B",
        website: "This is a website for Location B.",
        phoneNumber: "(999) 999-9999",
    },
    // {
    //     trackName: "Track C Title",
    //     address: "Location C address",
    //     email: "Email C",
    //     website: "This is a website for Location C.",
    //     phoneNumber: "(999) 999-9999",
    // },
    // ... more locations ...
];

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


// Click listener for info card objects
document.querySelectorAll('track-card').forEach(card => {
    card.addEventListener('click', function() {
        let locationId = card.getAttribute('data-name');
        focusOnMarker(locationId);
    });
});

async function focusOnMarker(locationId) {
    
    // Loop through all markers to find the one with the matching 
    for (let marker of markers) {
        if (marker.get('title') === locationId) {
            map.setCenter(marker.getPosition(), 4);
            // Optionally, you can also open an info window or animate the marker here
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
  
