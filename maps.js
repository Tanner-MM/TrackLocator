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
let markers = [];

async function initMap() {
    // const pos = { lat:  39.776326, lng: -121.8676 }; // Set coordinates for the pin, Method Marketing.
    const pos = { lat: 39.84181336054336, lng: -99.90822182318774 };

    // Request needed libraries.
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

    // The map, centered at me, Tanner
    map = new Map(document.getElementById("map"), {
        center: pos,
        mapId: "Track-Map",
        zoom: 5,
    });

    await fetch('Track-Data.csv')
        .then(res => res.text())
        .then(data => {
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
    

    await placeMarkers();
    // console.log(markers)
}


initMap();