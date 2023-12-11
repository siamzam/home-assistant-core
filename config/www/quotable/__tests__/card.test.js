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

  test("Call updateQuoteAndAuthor() is called if hass is set", () => {
    quotableCard.updateQuoteAndAuthor = jest.fn();
    quotableCard.hass = { states: {} };
    expect(quotableCard.updateQuoteAndAuthor).toHaveBeenCalled();
  });

  test("Don't call updateQuoteAndAuthor() if hass not set", () => {
    quotableCard.updateQuoteAndAuthor = jest.fn();
    quotableCard.hass = null;
    expect(quotableCard.updateQuoteAndAuthor).not.toHaveBeenCalled();
  });

  test("test showPreviousQuote function ", () => {
    const initialIndex = quotableCard.quoteIndex;
    const expectedIndex =
      (initialIndex - 1 + quotableCard.quotes.length) %
      quotableCard.quotes.length;
    const expectedQuote = quotableCard.quotes[expectedIndex].content;
    const expectedAuthor = quotableCard.quotes[expectedIndex].author;

    quotableCard.updateOverlay = jest.fn();
    quotableCard.showPreviousQuote();

    expect(quotableCard.quoteIndex).toBe(expectedIndex);
    expect(quotableCard.updateOverlay).toHaveBeenCalledWith(
      expectedQuote,
      expectedAuthor
    );
  });

  test("test showNextQuote function", () => {
    const initialIndex = quotableCard.quoteIndex;
    const expectedIndex = (initialIndex + 1) % quotableCard.quotes.length;
    const expectedQuote = quotableCard.quotes[expectedIndex].content;
    const expectedAuthor = quotableCard.quotes[expectedIndex].author;

    quotableCard.updateOverlay = jest.fn();
    quotableCard.showNextQuote();

    expect(quotableCard.quoteIndex).toBe(expectedIndex);
    expect(quotableCard.updateOverlay).toHaveBeenCalledWith(
      expectedQuote,
      expectedAuthor
    );
  });

  test("refreshQuote fetches a new quote", () => {
    quotableCard.fetchNewQuote = jest.fn();
    quotableCard.refreshQuote();
    expect(quotableCard.fetchNewQuote).toHaveBeenCalled();
  });

  test("getStubConfig returns quotable config", () => {
    const config = QuotableCard.getStubConfig();
    expect(config).toEqual({ entity: "quotable.quotable" });
  });
});
