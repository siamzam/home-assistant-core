// QuotableCard.test.js
const { QuotableCardEditor } = require("../src/card-editor");

describe("QuotableCardEditor", () => {
  let quotableEditor;
  let _selectedItems;
  let targetElement;
  let selectedItems;
  let id;

  beforeAll(() => {
    quotableEditor = new QuotableCardEditor();
  });

  beforeEach(() => {
    _selectedItems = [];
    targetElement = {
      dataset: {
        slug: "test",
        name: "test",
      },
      classList: {
        add: jest.fn(),
        remove: jest.fn(),
      },
    };
    selectedItems = {
      innerHTML: "",
    };
    id = {
      getElementsByTagName: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("QuotableCardEditor is defined", () => {
    expect(quotableEditor).toBeDefined();
    expect(quotableEditor instanceof QuotableCardEditor).toBeTruthy();
  });

  test("hass setter sets _hass", () => {
    const mockHass = {
      callWS: jest.fn().mockImplementation(() =>
        Promise.resolve({
          response: {
            success: true,
            data: ["hass"],
          },
        })
      ),
    };
    quotableEditor.hass = mockHass;
    expect(quotableEditor).toHaveProperty("_hass", mockHass);
  });

  test("setConfig sets _config", () => {
    const mockConfig = {
      entity: "quotable.quotable",
    };
    quotableEditor.setConfig(mockConfig);
    expect(quotableEditor).toHaveProperty("_config", mockConfig);
  });

  test("loadOptions loads authors and tags options", async () => {
    quotableEditor._authors = [
      "albert-einstein",
      "napoleon-hill",
      "alan-watts",
    ];
    quotableEditor._tags = ["success", "funny", "motivational"];

    const _hass = {
      states: {
        "quotable.quotable": {
          attributes: {
            styles: {
              bg_color: "existing_bg_color",
              text_color: "existing_text_color",
            },
          },
        },
      },
    };
    quotableEditor._config = { entity: "quotable.quotable" };

    const serviceData = {
      entity_id: "quotable.quotable",
    };
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

    const mockCallWS = jest.spyOn(quotableEditor._hass, "callWS");

    // Mock the implementation of the callWS method to return a successful response
    mockCallWS.mockImplementation((message) => {
      if (message.service === "fetch_all_authors") {
        return Promise.resolve({
          response: {
            success: true,
            data: ["albert-einstein", "napoleon-hill", "alan-watts"],
          },
        });
      } else if (message.service === "fetch_all_tags") {
        return Promise.resolve({
          response: {
            success: true,
            data: ["success", "funny", "motivational"],
          },
        });
      }
    });

    // Mock the renderForm method
    quotableEditor.renderForm = jest.fn();

    // Call the loadOptions method
    await quotableEditor.loadOptions();

    const authorResult = await quotableEditor._hass.callWS(authorMessage);
    const tagsResult = await quotableEditor._hass.callWS(tagMessage);

    // Check that the _authors and _tags properties were set correctly
    expect(quotableEditor._authors).toEqual(authorResult.response.data);
    expect(quotableEditor._tags).toEqual(tagsResult.response.data);
  });

  test("Test SearchAuthor with query for results", async () => {
    const mockCallWS = jest.spyOn(quotableEditor._hass, "callWS");

    mockCallWS.mockImplementation((message) => {
      if (message.service === "search_authors") {
        return Promise.resolve({
          response: {
            success: true,
            data: ["author1", "author2", "author3"],
          },
        });
      }
    });
    const mockGetElementById = jest.fn();
    quotableEditor.shadowRoot = { getElementById: mockGetElementById };
    await quotableEditor.searchAuthor("query");
    expect(mockCallWS).toHaveBeenCalledWith({
      domain: "quotable",
      service: "search_authors",
      type: "call_service",
      return_response: true,
      service_data: {
        entity_id: quotableEditor._config.entity,
        query: "query",
      },
    });
    expect(quotableEditor._authors).toEqual(["author1", "author2", "author3"]);
  });

  test("fetchQuote calls service with correct parameters", async () => {
    const mockCallWS = jest.spyOn(quotableEditor._hass, "callWS");

    //Mock the service call
    mockCallWS.mockImplementation((message) => {
      if (message.service === "fetch_a_quote") {
        return Promise.resolve({
          response: {
            success: true,
            data: ["quote1", "quote2", "quote3"],
          },
        });
      }
    });

    //Call the fetchquote function
    await quotableEditor.fetchQuote();

    //Check if right params were sent
    expect(mockCallWS).toHaveBeenCalledWith({
      domain: "quotable",
      service: "fetch_a_quote",
      type: "call_service",
      return_response: true,
      service_data: {
        entity_id: quotableEditor._config.entity,
      },
    });
  });

  test("removes item if it is in _selectedItems", () => {
    const addRemoveSelectedItem = quotableEditor.addRemoveSelectedItem;

    jest.mock(quotableEditor.addRemoveSelectedItem, () => ({
      updateConfiguration: jest.fn(),
      getElementsByTagName: jest.fn(),
    }));
    _selectedItems.push(targetElement.dataset);
    id.getElementsByTagName.mockReturnValue([
      {
        dataset: targetElement.dataset,
        classList: {
          remove: jest.fn(),
        },
      },
    ]);

    addRemoveSelectedItem(_selectedItems, targetElement, selectedItems, id);

    expect(_selectedItems.length).toBe(0);
    expect(selectedItems.innerHTML).toBe("");
    expect(id.getElementsByTagName).toHaveBeenCalledWith("li");
    expect(targetElement.classList.remove).not.toHaveBeenCalled();
  });

  test("adds item if it is not in _selectedItems", () => {
    const addRemoveSelectedItem = quotableEditor.addRemoveSelectedItem;

    jest.mock(quotableEditor.addRemoveSelectedItem, () => ({
      updateConfiguration: jest.fn(),
      getElementsByTagName: jest.fn(),
    }));
    addRemoveSelectedItem(_selectedItems, targetElement, selectedItems, id);

    expect(_selectedItems.length).toBe(1);
    expect(_selectedItems[0]).toEqual(targetElement.dataset);
    expect(selectedItems.innerHTML).toContain(
      `<span data-slug="${targetElement.dataset.slug}" data-name="${targetElement.dataset.name}">${targetElement.dataset.name}</span>`
    );
    expect(targetElement.classList.add).toHaveBeenCalledWith("selected");
  });
});
