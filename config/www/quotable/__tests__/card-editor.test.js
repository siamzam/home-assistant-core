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
});
