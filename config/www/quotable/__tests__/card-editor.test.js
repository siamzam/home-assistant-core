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
});
