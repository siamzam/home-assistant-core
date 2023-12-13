class QuotableCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._authors = [];
    this._initial_authors = [];
    this._selectedAuthors = [];
    this._tags = [];
    this._selectedTags = [];
    this._intervalValue = "";
    this._bgColor = "";
    this._textColor = "";
  }

  // Initialize hass instance
  set hass(hass) {
    this._hass = hass;
  }

  // Initialize config
  setConfig(config) {
    this._config = config;
  }

  // Load select options when editor connected to DOM
  async connectedCallback() {
    this.loadOptions();
  }

  // Check if an author/tag is selected
  isSelected(selectedList, selectedItem) {
    return selectedList.some((item) => item.slug == selectedItem.slug);
  }

  async loadOptions() {
    try {
      if (!this._config.entity) {
        return;
      }

      // Set config values from hass state initially
      const initialState = this._hass.states[this._config.entity];
      if (initialState) {
        this._selectedAuthors = initialState.attributes.selected_authors;
        this._selectedTags = initialState.attributes.selected_tags;
        this._selectedBgColor = initialState.attributes.styles.bg_color;
        this._selectedTextColor = initialState.attributes.styles.text_color;

        const updateFrequency = initialState.attributes.update_frequency / 60;
        this._intervalValue = updateFrequency.toString();
      }

      // Data payload that is transmitted as part of the service call
      const serviceData = {
        entity_id: this._config.entity,
      };

      // Message object used when calling quotable service

      const authorMessage = {
        domain: "quotable",
        service: "fetch_all_authors",
        type: "call_service",
        return_response: true,
        service_data: serviceData,
      };
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

    // Finally show form content
    this.renderForm();
  }

  // Render the visual representation
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

      li:not(.selected):hover {
        background-color: #eee;
      }

      div.selected span {
        display: inline-block;
        padding: 2px 8px;
        margin-right: 5px;
        background-color: #ccc;
        cursor: pointer;
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
        <div class="selected" id="selectedAuthors">
          ${this._selectedAuthors
            .map(
              (author) =>
                `<span data-name="${author.name}" data-slug="${author.slug}">${author.name}</span>`
            )
            .join("")}
        </div>
        <ul id="authorSelect">
          ${this._authors
            .map(
              (author) =>
                `<li class="${
                  this.isSelected(this._selectedAuthors, author)
                    ? "selected"
                    : ""
                }" data-name="${author.name}" data-slug="${author.slug}">${
                  author.name
                }</li>`
            )
            .join("")}
        </ul>
      </div>

      <div>
        <h4>Tags</h4>
        <div class="selected" id="selectedTags">
          ${this._selectedTags
            .map(
              (tag) =>
                `<span data-name="${tag.name}" data-slug="${tag.slug}">${tag.name}</span>`
            )
            .join("")}
        </div>
        <ul id="tagSelect">
        ${this._tags
          .map(
            (tag) =>
              `<li class="${
                this.isSelected(this._selectedTags, tag) ? "selected" : ""
              }" data-name="${tag.name}" data-slug="${tag.slug}">${
                tag.name
              }</li>`
          )
          .join("")}
        </ul>
      </div>

      <div>
        <h4>Update Interval (mins)</h4>
        <input type="range" id="slider" min="1" max="60" value="${
          this._intervalValue
        }">
        <span id="updateIntervalLabel">${this._intervalValue}</span>
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

    const handleAuthorSelectClickEvent = (event) => {
      const authorEl = event.target;
      this.addRemoveSelectedItem(
        this._selectedAuthors,
        authorEl,
        selectedAuthors,
        authorSelect
      );
    };

    const handleTagSelectClickEvent = (event) => {
      const tagEl = event.target;
      this.addRemoveSelectedItem(
        this._selectedTags,
        tagEl,
        selectedTags,
        tagSelect
      );
    };

    // Event listener for search author input (Listens as user types)
    authorInput.addEventListener("keyup", () => {
      this.searchAuthor(authorInput.value);
    });
    // Event listener for search author select
    authorSelect.addEventListener("click", handleAuthorSelectClickEvent);
    selectedAuthors.addEventListener("click", handleAuthorSelectClickEvent);

    // Event listener for tag select
    tagSelect.addEventListener("click", handleTagSelectClickEvent);
    selectedTags.addEventListener("click", handleTagSelectClickEvent);

    // Event listener for interval slider
    updateIntervalSlider.addEventListener("input", (event) => {
      updateIntervalLabel.textContent = event.target.value;
      this._intervalValue = event.target.value;
    });

    // Event listeners for color pickers
    bgColorPicker.addEventListener("input", () => {
      this._selectedBgColor = bgColorPicker.value;
    });

    textColorPicker.addEventListener("input", () => {
      this._selectedTextColor = textColorPicker.value;
    });

    // Event listeners for updating config whiles user makes selections
    form.addEventListener("focusout", this.updateConfiguration.bind(this));
  }

  // Handles addition and removal of the selected item from the lists
  addRemoveSelectedItem(_selectedItems, targetElement, selectedItems, id) {
    if (targetElement.dataset.slug === undefined) {
      return;
    }

    const index = _selectedItems.findIndex(
      (item) => item.slug == targetElement.dataset.slug
    );
    if (index >= 0) {
      _selectedItems.splice(index, 1);
      const els = id.getElementsByTagName("li");
      for (var i = 0; i < els.length; i++) {
        if (els[i].dataset.slug == targetElement.dataset.slug) {
          els[i].classList.remove("selected");
        }
      }
    } else {
      _selectedItems.push({
        name: targetElement.dataset.name,
        slug: targetElement.dataset.slug,
      });
      targetElement.classList.add("selected");
    }

    selectedItems.innerHTML = _selectedItems
      .map(
        (item) =>
          `<span data-slug="${item.slug}" data-name="${item.name}">${item.name}</span>`
      )
      .join("");

    this.updateConfiguration();
  }

  // Search for a particular author
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
      // Replace existing author options with response
      if (this._authors.length >= 0) {
        const authorSelect = this.shadowRoot.getElementById("authorSelect");

        authorSelect.innerHTML = this._authors
          .map(
            (author) =>
              `<li class="${
                this._selectedAuthors.some((a) => a.slug == author.slug)
                  ? "selected"
                  : ""
              }" data-name="${author.name}" data-slug="${author.slug}">${
                author.name
              }</li>`
          )
          .join("");
      }
    } catch (error) {
      return;
    }
  }

  // Update config with form details
  async updateConfiguration() {
    try {
      const updateConfigData = {
        entity_id: this._config.entity,
        selected_tags: this._selectedTags,
        selected_authors: this._selectedAuthors,
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

      // Hass service call to update config
      const responseUpdateConfig = await this._hass.callWS(updateConfigMessage);

      if (responseUpdateConfig) {
        const newConfig = this._config;
        // Fire a config changed event
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

  // Update preview with new quote
  async fetchQuote() {
    const fetchData = {
      entity_id: this._config.entity,
    };

    const fetchNew = {
      domain: "quotable",
      service: "fetch_a_quote",
      type: "call_service",
      return_response: true,
      service_data: fetchData,
    };

    // Hass service call to update quote on card
    await this._hass.callWS(fetchNew);
  }
}

customElements.define("quotable-card-editor", QuotableCardEditor);

if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
  module.exports = { QuotableCardEditor };
}
