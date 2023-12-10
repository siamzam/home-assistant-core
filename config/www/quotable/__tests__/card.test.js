// Tests for quotable card
const { QuotableCard } = require("../src/card");

describe("QuotableCard", () => {
  let quotableCard;

  beforeAll(() => {
    quotableCard = new QuotableCard();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    quotableCard.quoteIndex = 0;

    quotableCard._hass = {
      states: {
        "quotable.quotable": {
          attributes: {
            quotes: JSON.stringify([
              { content: "Test quote 1", author: "Test author 1" },
              { content: "Test quote 2", author: "Test author 2" },
            ]),
            styles: {
              bg_color: "#000000",
              text_color: "#ff0000",
            },
          },
        },
      },
    };
    quotableCard._config = { entity: "quotable.quotable" };
    quotableCard.render = jest.fn();
    quotableCard.fetchNewQuote = jest.fn();
  });

  test("QuotableCard is defined", () => {
    expect(quotableCard).toBeDefined();
    expect(quotableCard instanceof QuotableCard).toBeTruthy();
  });

  test("Card renders with test quote and author", async () => {
    await quotableCard.updateQuoteAndAuthor();

    expect(quotableCard.render).toHaveBeenCalledWith(
      "Test quote 1",
      "Test author 1"
    );
  });

  test("Card fetches a new quote if there are no quotes", async () => {
    quotableCard._hass.states["quotable.quotable"].attributes.quotes =
      JSON.stringify([]);

    await quotableCard.updateQuoteAndAuthor();

    expect(quotableCard.fetchNewQuote).toHaveBeenCalled();
  });
});
