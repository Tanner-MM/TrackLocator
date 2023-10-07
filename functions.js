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
        trackName: "Track A title",
        address: "Location A address",
        email: "Email A",
        website: "This is a website for Location A.",
        phoneNumber: "(999) 999-9999",
    },
    {
        trackName: "Track B Title",
        address: "Location B address",
        email: "Email B",
        website: "This is a website for Location B.",
        phoneNumber: "(999) 999-9999",
    },
    // ... more locations ...
  ];

  const trackContainer = document.getElementById("track-container");
  tracks.forEach(track => {
    const trackEl = document.createElement("track-card");

    for (let [key, value] of Object.entries(track)) {
      let propEl = document.createElement("span");
      propEl.setAttribute("slot", key);
      propEl.textContent = value;
      trackEl.appendChild(propEl);
    }

    trackContainer.appendChild(trackEl);
  });
