// import { google } from 'googleapis';
// const sheets = google.sheets('v4');

// const sheetId = '1VPIMwk3TmPQxFLeuqysH1GPzaiUv4LAQJ6EndcOoklQ';
// const range = 'Sheet1!A1:D10';
// const range = 'Sheet1';

let map;
// let rows; // Holds a list of each row in the csv
let coordinates = []; // Holds a list of all coordinate pairs for each track
let locations = [];
let parsedData = [];

async function initMap() {
    // const pos = { lat:  39.776326, lng: -121.8676 }; // Set coordinates for the pin, Method Marketing.
    const pos = { lat: 39.84181336054336, lng: -99.90822182318774 };

    // Request needed libraries.
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

    // The map, centered at me, Tanner
    map = new Map(document.getElementById("map"), {
        center: pos,
        mapId: "DEMO_MAP_ID",
        zoom: 5,
    });

    // For a single marker
    // The marker, positioned at at Method Marketing
    // const marker = new AdvancedMarkerElement({
    //     map: map,
    //     position: pos,
    //     title: "Tanner",
    // });

    await fetch('Track-Data.csv')
        .then(res => res.text())
        .then(data => {
            // Lists that are correct
            let rows = data.split('\n').map(row => row.trim()).filter(row => row.length); // Splits each row into its own element, trims whitespace, and filters any empty rows
            parsedData = rows.slice(1).map(row => {
                const columns = row.split(',');
                return columns.map(column => 
                    column.replace(/^"|"$/g, '').replace(/%/g, ',')
                );
            });
            
            // Parsing the formatted data for the coordinates and 
            // coordinates = parsedData.map(item => [+item[5], +item[6]]); // Includes tracks that have 'null' for the coordinates and stores the values as floats
            coordinates = parsedData.filter(item => item[5] !== 'null' && item[6] !== 'null').map(item => [+item[5], +item[6]]); // Omits tracks that do not have coordinates and converts values to a float
            
            locations = parsedData.map(item => item[0]);
        })
        .catch(err => console.error(err)
    );
    // console.log("\Parsed Data\n", parsedData);
    


    let infowindow = new google.maps.InfoWindow({});
    let marker;
    for (let i = 0; i < coordinates.length; i++) {
        marker = new google.maps.Marker({
            position: new google.maps.LatLng(coordinates[i][0], coordinates[i][1]),
            map: map,
            // icon: {
            //     path: 'M -2,0 0,-2 2,0 0,2 z',
            //     fillColor: '#FF0000',
            //     fillOpacity: 1,
            //     scale: 1
            // }
            title: locations[i],
            // opacity: .5
        });
        google.maps.event.addListener(marker, 'click', (function (marker, i) {
            return function () {
                infowindow.setContent(locations[i]);
                infowindow.open(map, marker);
                // marker.setOpacity(1)
            }
        })(marker, i));
  }
}

initMap();