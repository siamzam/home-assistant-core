class QuotableCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._authors = [];
    this._initial_authors = [];
    this._selectedAuthors = [];
    this._tags = [];
    this._selectedTags = [];
    this._intervalValue = 300;
    this._bgColor = "";
    this._textColor = "";
  }

  set hass(hass) {
    this._hass = hass;
  }

  setConfig(config) {
    this._config = config;
  }

  async connectedCallback() {
    this.loadOptions();
  }

  async loadOptions() {
    try {
      if (!this._config.entity) {
        return;
      }

      //Data payload that is transmitted as part of the service call
      const serviceData = {
        entity_id: this._config.entity,
      };

      const authorMessage = {
        domain: "quotable",
        service: "fetch_all_authors",
        type: "call_service",
        return_response: true,
        service_data: serviceData,
      };

      //Message object used when calling quotable service
      const tagMessage = {
        domain: "quotable",
        service: "fetch_all_tags",
        type: "call_service",
        return_response: true,
        service_data: serviceData,
      };

      // Call quotable service to fetch an initial list of authors
      const authorsResult = await this._hass.callWS(authorMessage);
      this._authors = authorsResult.response.success
        ? authorsResult.response.data
        : [];

      this._initial_authors = this._authors;

      // Call quotable service to fetch all tags
      const tagsResult = await this._hass.callWS(tagMessage);
      this._tags = tagsResult.response.success ? tagsResult.response.data : [];
    } catch (error) {
      return;
    }

    this._selectedBgColor =
      this._hass.states[this._config.entity].attributes.styles.bg_color || "";
    this._selectedTextColor =
      this._hass.states[this._config.entity].attributes.styles.text_color || "";
    this.renderForm();
  }

  //Render the visual representation
  renderForm() {
    // Add the container to the shadow DOM
    this.shadowRoot.innerHTML = `
    <style>
      #quotable-form {
        padding: 20px;
      }

      #quotable-form * {
        box-sizing: border-box;
      }

      ul {
        width: 100%;
        height: 100px;
        border: 1px solid #ccc;
        border-radius: 5px;
        padding: 5px;
        overflow-y: auto;
        list-style-type: none
        margin: 0;
        padding: 0;
      }

      li {
        padding: 5px;
        cursor: pointer;
        background-color: transparent;
      }

      li.selected {
        background-color: #007BFF;
      }

      input[type="text"] {
        width: 100%;
        padding: 5px;
        margin-bottom: 10px;
      }

      input[type="range"] {
        width: 80%;
        height: 10px;
        border: 1px solid #ccc;
        border-radius: 5px;
        background-color: #fdd835;
        outline: none;
      }

      input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 20px;
        height: 20px;
        background-color: #007BFF;
        border: 1px solid #007BFF;
        border-radius: 50%;
        cursor: pointer;
      }

      input[type="text"] {
        width: 100%;
        padding: 5px;
        margin-bottom: 10px;
      }
    </style>

    <form id="quotable-form">
      <h3>Styles</h3>
      <div style="display: flex; align-items: center;">
        <label for="backgroundColorPicker" style="margin-right: 10px;">Select Card Background Color:</label>
        <input type="color" id="backgroundColorPicker" value=${
          this._selectedBgColor
        }>
        <label for="TextColorPicker" style="margin-left: 20px; margin-right: 10px;">Select Quote Text Color:</label>
        <input type="color" id="textColorPicker" value=${
          this._selectedTextColor
        }>
      </div>

      <div>
        <h4 for="authorSelect">Authors</h4>
        <input type="text" id="authorInput" placeholder="Type to search for authors">
        <div id="selectedAuthors"></div>
        <ul id="authorSelect">
          ${this._authors
            .map(
              (author) =>
                `<li data-name="${author.name}" data-slug="${author.slug}" value="${author.slug}">${author.name}</li>`
            )
            .join("")}
        </ul>
      </div>

      <div>
        <h4>Tags</h4>
        <div id="selectedTags"></div>
        <ul id="tagSelect">
        ${this._tags
          .map(
            (tag) =>
              `<li data-name="${tag.name}" data-slug="${tag.slug}" value="${tag.slug}">${tag.name}</li>`
          )
          .join("")}
        </ul>
      </div>

      <div>
        <h4>Update Interval (mins)</h4>
        <input type="range" id="slider" min="1" max="60" value="50">
        <span id="updateIntervalLabel">50</span>
      </div>
    </form>
  `;

    // Add references to the input and multiselect elements
    const authorInput = this.shadowRoot.getElementById("authorInput");
    const authorSelect = this.shadowRoot.getElementById("authorSelect");
    const tagSelect = this.shadowRoot.getElementById("tagSelect");
    const updateIntervalSlider = this.shadowRoot.getElementById("slider");
    const updateIntervalLabel = this.shadowRoot.getElementById(
      "updateIntervalLabel"
    );
    const selectedAuthors = this.shadowRoot.getElementById("selectedAuthors");
    const selectedTags = this.shadowRoot.getElementById("selectedTags");
    const form = this.shadowRoot.getElementById("quotable-form");
    const bgColorPicker = this.shadowRoot.getElementById(
      "backgroundColorPicker"
    );
    const textColorPicker = this.shadowRoot.getElementById("textColorPicker");

    // Add  event listener to search author
    authorInput.addEventListener("keyup", () => {
      this.searchAuthor(authorInput.value);
    });

    // Add click event listener to update selected author list
    authorSelect.addEventListener("click", (event) => {
      const authorEl = event.target;
      // Add or remove the selected item from the lists
      const authorIndex = this._selectedAuthors.findIndex(
        (author) => author.slug == authorEl.dataset.slug
      );
      if (authorIndex >= 0) {
        this._selectedAuthors.splice(authorIndex, 1);
        authorEl.classList.remove("selected");
      } else {
        this._selectedAuthors.push({
          name: authorEl.dataset.name,
          slug: authorEl.dataset.slug,
        });
        authorEl.classList.add("selected");
      }
      // Update the selected author list
      selectedAuthors.textContent = this._selectedAuthors
        .map((author) => author.name)
        .join(", ");
    });

    // Add click event listener to update selected tags list
    tagSelect.addEventListener("click", (event) => {
      const tagEl = event.target;
      // Add or remove the selected item from the lists
      const tagIndex = this._selectedTags.findIndex(
        (tag) => tag.slug == tagEl.dataset.slug
      );
      if (tagIndex >= 0) {
        this._selectedTags.splice(tagIndex, 1);
        tagEl.classList.remove("selected");
      } else {
        this._selectedTags.push({
          name: tagEl.dataset.name,
          slug: tagEl.dataset.slug,
        });
        tagEl.classList.add("selected");
      }
      // Update the selected tags input
      selectedTags.textContent = this._selectedTags
        .map((tag) => tag.name)
        .join(", ");
    });

    // Add input event listener to  interval slider
    updateIntervalSlider.addEventListener("input", () => {
      updateIntervalLabel.textContent = updateIntervalSlider.value;
      this.intervalValue = updateIntervalSlider.value;
    });

    // Add event listeners for color pickers
    bgColorPicker.addEventListener("input", () => {
      this._selectedBgColor = bgColorPicker.value;
    });

    textColorPicker.addEventListener("input", () => {
      this._selectedTextColor = textColorPicker.value;
    });

    form.addEventListener("focusout", this.updateConfiguration.bind(this));
  }

  async searchAuthor(query) {
    try {
      const searchData = {
        entity_id: this._config.entity,
        query: query,
      };

      const searchMessage = {
        domain: "quotable",
        service: "search_authors",
        type: "call_service",
        return_response: true,
        service_data: searchData,
      };

      if (query === "") {
        this._authors = this._initial_authors;
      } else {
        const searchResult = await this._hass.callWS(searchMessage);

        this._authors = searchResult.response.success
          ? searchResult.response.data
          : [];
      }

      if (this._authors.length >= 0) {
        const authorSelect = this.shadowRoot.getElementById("authorSelect");
        // Clear existing options
        authorSelect.innerHTML = "";
        // Add new options based on the author array
        const childEls = this._authors
          .map(
            (author) =>
              `<li class="${
                this._selectedAuthors.some((a) => a.slug == author.slug)
                  ? "selected"
                  : ""
              }" data-name="${author.name}" data-slug="${author.slug}" value="${
                author.slug
              }">${author.name}</li>`
          )
          .join("");

        authorSelect.innerHTML = childEls;
      }
    } catch (error) {
      return;
    }
  }

  async updateConfiguration() {
    try {
      const updateConfigData = {
        entity_id: this._config.entity,
        selected_tags: this._selectedTags.map((tag) => tag.slug),
        selected_authors: this._selectedAuthors.map((author) => author.slug),
        update_frequency: parseInt(this._intervalValue) * 60,
        styles: {
          bg_color: this._selectedBgColor,
          text_color: this._selectedTextColor,
        },
      };

      const updateConfigMessage = {
        domain: "quotable",
        service: "update_configuration",
        type: "call_service",
        return_response: false,
        service_data: updateConfigData,
      };

      const responseUpdateConfig = await this._hass.callWS(updateConfigMessage);

      if (responseUpdateConfig) {
        const newConfig = this._config;
        const event = new CustomEvent("config-changed", {
          detail: { config: newConfig },
          bubbles: true,
          composed: true,
        });
        this.dispatchEvent(event);
        this.fetchQuote();
      }
    } catch (error) {
      return;
    }
  }

  async fetchQuote() {
    const fetchData = {
      entity_id: this._config.entity,
    };

    //Message object used when calling quotable service
    const fetchNew = {
      domain: "quotable",
      service: "fetch_a_quote",
      type: "call_service",
      return_response: true,
      service_data: fetchData,
    };

    // Call quotable service to fetch new quote
    await this._hass.callWS(fetchNew);
  }
}

customElements.define("quotable-card-editor", QuotableCardEditor);

if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
  module.exports = { QuotableCardEditor };
}
