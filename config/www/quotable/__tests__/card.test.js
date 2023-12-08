// QuotableCard.test.js
const { QuotableCard } = require("../src/card");

describe("QuotableCard", () => {
  let quotableCard;

  beforeAll(() => {
    quotableCard = new QuotableCard();
  });

  beforeEach(() => {});

  test("QuotableCard is defined", () => {
    expect(quotableCard).toBeDefined();
    expect(quotableCard instanceof QuotableCard).toBeTruthy();
  });
});
