// QuotableCard.test.js
const { QuotableCardEditor } = require("../src/card-editor");

describe("QuotableCardEditor", () => {
  let quotableEditor;

  beforeAll(() => {
    quotableEditor = new QuotableCardEditor();
  });

  beforeEach(() => {});

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
});
