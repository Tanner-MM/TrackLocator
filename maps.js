// import { google } from 'googleapis';
// const sheets = google.sheets('v4');

// const sheetId = '1VPIMwk3TmPQxFLeuqysH1GPzaiUv4LAQJ6EndcOoklQ';
// const range = 'Sheet1!A1:D10';
// const range = 'Sheet1';

let map;

async function initMap() {
    const pos = { lat:  39.776326, lng: -121.8676 }; // Set coordinates for the pin, Method Marketing.

    let locations = [ // Set coordinates for the pins.
        ['Method Marketing', 39.776326, -121.8676],
        ['CSU Chico', 39.72906900410867, -121.8486567877364],
        ['Bidwell Park', 39.734714015310544, -121.82700290936715],
        ['Hooker Oak Park', 39.758747, -121.796866],
        ['Chico Nissan', 39.75876619481564, -121.84357004355181],
        ['Pine Tree Apartments', 39.719927119726194, -121.83854688980773]
    ];

    // Request needed libraries.
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

    // The map, centered at me, Tanner
    map = new Map(document.getElementById("map"), {
        zoom: 4,
        center: pos,
        mapId: "DEMO_MAP_ID",
        zoom: 12,
    });

    // For a single marker
    // The marker, positioned at at Method Marketing
    // const marker = new AdvancedMarkerElement({
    //     map: map,
    //     position: pos,
    //     title: "Tanner",
    // });
    fetch('Track-Data.csv')
        .then(res => res.text())
        .then(data => {
            let rows = data.split('\n'); // Splits each row into its own element
            let coordinates = []; // Holds list of all coordinates
            let parsedData = []; // An array containing an array of each entry as elements


            // Loops through each row and splits each entry into a separate element in an array
            for (let i = 0; i < rows.length; i++) {
                let columns = rows[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
                // columns = rows[i].split(',');
                for (let j = 0; j < columns.length; j++) {
                    columns[j] = columns[j].replace(/^"|"$/g, ''); // Cleanses each entry of any hanging " or / chars
                }
                parsedData.push(columns) // Pushes the split row into a new array
                // parsedData.slice(1);
            }

            console.log("\Parsed Data\n", parsedData);

            
            for(let i = 0; i < parsedData.length; i++) {
                coordinates.push(parsedData[i][5]);
            }
            console.log("Coordinates\n", coordinates)

            // console.log("\nRows\n", rows);
        })
        .catch(err => console.error(err));

    let infowindow = new google.maps.InfoWindow({});
    let marker, count;
    for (count = 0; count < locations.length; count++) {
        marker = new google.maps.Marker({
            position: new google.maps.LatLng(locations[count][1], locations[count][2]),
            map: map,
            title: locations[count][0]
        });
        google.maps.event.addListener(marker, 'click', (function (marker, count) {
            return function () {
                infowindow.setContent(locations[count][0]);
                infowindow.open(map, marker);
            }
        })(marker, count));
  }
}

initMap();