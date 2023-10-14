function createCustomElement() {
    customElements.define(
        "track-card",
        class extends HTMLElement {
            constructor() {
                super();
                const template = document.getElementById("track-card").content;
                const shadowRoot = this.attachShadow({ mode: "open" });
                shadowRoot.appendChild(template.cloneNode(true));

                this._card = shadowRoot.querySelector('.card');
                this._websiteContainer = shadowRoot.getElementById('website-link');
                this._facebookContainer = shadowRoot.getElementById('fb-link')
            }

            get card() {
                return this._card;
            }

            connectedCallback() { // Fires when the element is rendered in the template
                let websiteSvg = '<svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 640 512"><path d="M579.8 267.7c56.5-56.5 56.5-148 0-204.5c-50-50-128.8-56.5-186.3-15.4l-1.6 1.1c-14.4 10.3-17.7 30.3-7.4 44.6s30.3 17.7 44.6 7.4l1.6-1.1c32.1-22.9 76-19.3 103.8 8.6c31.5 31.5 31.5 82.5 0 114L422.3 334.8c-31.5 31.5-82.5 31.5-114 0c-27.9-27.9-31.5-71.8-8.6-103.8l1.1-1.6c10.3-14.4 6.9-34.4-7.4-44.6s-34.4-6.9-44.6 7.4l-1.1 1.6C206.5 251.2 213 330 263 380c56.5 56.5 148 56.5 204.5 0L579.8 267.7zM60.2 244.3c-56.5 56.5-56.5 148 0 204.5c50 50 128.8 56.5 186.3 15.4l1.6-1.1c14.4-10.3 17.7-30.3 7.4-44.6s-30.3-17.7-44.6-7.4l-1.6 1.1c-32.1 22.9-76 19.3-103.8-8.6C74 372 74 321 105.5 289.5L217.7 177.2c31.5-31.5 82.5-31.5 114 0c27.9 27.9 31.5 71.8 8.6 103.9l-1.1 1.6c-10.3 14.4-6.9 34.4 7.4 44.6s34.4 6.9 44.6-7.4l1.1-1.6C433.5 260.8 427 182 377 132c-56.5-56.5-148-56.5-204.5 0L60.2 244.3z"/></svg>';
                let facebookSvg = '<svg xmlns="http://www.w3.org/2000/svg" height="1.25em" viewBox="0 0 512 512"><path d="M504 256C504 119 393 8 256 8S8 119 8 256c0 123.78 90.69 226.38 209.25 245V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.28c-30.8 0-40.41 19.12-40.41 38.73V256h68.78l-11 71.69h-57.78V501C413.31 482.38 504 379.78 504 256z"/></svg>';

                // Get the website URL from the slot
                const websiteSlot = this.querySelector('[slot="website"]');
                if (!!websiteSlot) {

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
                    const facebookLink = document.createElement('div');
                    facebookLink.classList.add('facebook-icon');
                    facebookLink.innerHTML = facebookSvg;
                    this.shadowRoot.appendChild(facebookLink);
                    this._facebookContainer.appendChild(facebookLink);

                    facebookLink.title = 'Visit Facebook Page';
                    facebookLink.addEventListener('click', () => {
                        window.open(facebookSlot.textContent, '_blank');
                    });
                    facebookSlot.style.display = 'none'; // Hide the facebook slot that is generated
                }
            }
        }
    );
}


async function initMap() {
    const { Map } = await google.maps.importLibrary("maps");

    createMap = (pos, zoom = 4) => {
        map = new Map(document.getElementById("map"), {
            center: pos,
            mapId: "Track-Map",
            zoom: zoom,
        });
    }

    try {
        const pos = await getUserLocation();
        createMap(pos, 8);

    } catch (error) {
        console.error("Error fetching user's location:", error.message);
        const pos = { lat: 39.84181336054336, lng: -99.90822182318774 }; // Center of USA as default map center
        createMap(pos, 4);
    }

    await parseCsv();
    await placeMarkers();
}




async function main() { // entry point
    await initMap();
    createCustomElement();
    generateCardInfoAndClickListeners(); // Creates objects to populate the card data
}


main();