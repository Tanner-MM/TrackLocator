
async function initMap() {
    // const pos = { lat:  39.776326, lng: -121.8676 }; // Set coordinates for the pin, Method Marketing.
    const pos = { lat: 39.84181336054336, lng: -99.90822182318774 };

    // Request needed libraries.
    const { Map } = await google.maps.importLibrary("maps");
    // const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

    map = new Map(document.getElementById("map"), {
        center: pos,
        mapId: "Track-Map",
        zoom: 5,
    });

    await parseCsv();
    await placeMarkers();
}


async function main() {

    await initMap();

    // Define info card template
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

                this._card = shadowRoot.querySelector('.card');
            }

            get card() {
                return this._card;
            }
        }
    );

    generateInfoCards(); // Creates objects to populate the card data

    // Click listeners for info card objects
    createClickListeners();
}


main();