
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
    placeMarkers();
}




async function main() { // entry point
    await initMap();
    
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
                this._facebookContainer = shadowRoot.getElementById('fb-link');
                this._instagramContainer = shadowRoot.getElementById('ig-link');
            }

            get card() {
                return this._card;
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
                    facebookLink.classList.add('facebook-icon'); ///////////
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
                    igLink.classList.add('ig-icon'); /////////
                    igLink.innerHTML = igSvg;
                    this.shadowRoot.appendChild(igLink);
                    this._instagramContainer.appendChild(igLink);
                    igLink.addEventListener('click', () => {
                        window.open(igSlot.textContent, '_blank');
                    })
                    igSlot.style.display = 'none';
                }
            }
        }
    );

    generateCardInfoAndClickListeners(); // Creates objects to populate the card data
}


main();