import Args from "../args";

describe("ContextArgs", () => {
  let subject;

  beforeEach(() => {
    subject = new Args();
  });

  it("safely gets empty object", () => {
    expect(subject.get("query.playlists")).toEqual({});
  });

  it("extends and gets with valid resolver pair key", () => {
    subject.extend("query.playlists", { a: "b" });
    expect(subject.get("query.playlists")).toEqual({ a: "b" });
  });

  it("extends multiple items, preferring last objects", () => {
    subject.extend("query.playlists", { a: "b", c: "d" });
    subject.extend("query.playlists", { x: "y", c: "OVERRIDE" });

    expect(subject.get("query.playlists")).toEqual({
      a: "b",
      x: "y",
      c: "OVERRIDE",
    });
  });

  it("is case insensitive", () => {
    subject.extend("QUERY.Playlists", { a: "b" });
    expect(subject.get("Query.playlists")).toEqual({ a: "b" });
  });

  it("throws on extending invalid resolver pair key", () => {
    expect(() => {
      subject.extend("bad.resolverPair", { a: "b" });
    }).toThrow(
      "Invalid resolver key `bad.resolverPair` chosen for context args. The key must be a valid \"type.resolver\" string"
    );
  });

  it("throws on extending on scalar / individual resolver", () => {
    expect(() => {
      subject.extend("DateTime", { a: "b" });
    }).toThrow(
      "Invalid resolver key `DateTime` chosen for context args. The key must be a valid \"type.resolver\" string"
    );
  });

  it("throws on getting invalid resolver pair key", () => {
    expect(() => {
      subject.get("bad.resolver", { a: "b" });
    }).toThrow(
      "Invalid resolver key `bad.resolver` chosen for context args. The key must be a valid \"type.resolver\" string"
    );
  });

  it("throws on extending non object", () => {
    expect(() => {
      subject.extend("query.playlists", "not an object");
    }).toThrow(
      "Context args can only be set with plain objects. It was set with `not an object`"
    );
  });
});
