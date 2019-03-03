import hashKey, { stableStringKey } from "../hashKey";

describe("hashKey and stableStringKey", () => {
  describe("primatives", () => {
    it("stringifies as is", () => {
      expect(stableStringKey("hey")).toEqual("hey");
    });

    it("stringifies other primatives", () => {
      expect(stableStringKey(false)).toEqual("false");
      expect(stableStringKey(null)).toEqual("null");
      expect(stableStringKey(42)).toEqual("42");
    });

    it("hashes string consistently", () => {
      expect(hashKey("hey")).toMatchSnapshot();
    });

    it("hashes boolean consistently", () => {
      expect(hashKey(false)).toMatchSnapshot();
    });

    it("hashes number consistently", () => {
      expect(hashKey(42)).toMatchSnapshot();
    });

    it("hashes null consistently", () => {
      expect(hashKey(null)).toMatchSnapshot();
    });
  });

  describe("objects", () => {
    const obj = {
      a: "hi",
      b: {
        x: 1,
        y: 2,
      },
      c: [true, false],
    };

    const sameValueObj = {
      c: [true, false],
      a: "hi",
      b: {
        y: 2,
        x: 1,
      },
    };

    const differentObj = {
      ultimately: [true, false],
      a: "hi",
      b: {
        y: 2,
        x: 1,
      },
    };

    it("stringifies objects", () => {
      expect(stableStringKey(obj))
        .toEqual("{\"a\":\"hi\",\"b\":{\"x\":1,\"y\":2},\"c\":[true,false]}");
    });

    it("stringifies to match any deep equal object, regardless of order", () => {
      expect(stableStringKey(obj)).toEqual(stableStringKey(sameValueObj));
    });

    it("hashes the same objects", () => {
      expect(hashKey(obj)).toEqual(hashKey(sameValueObj));
    });

    it("does not match different object hashes", () => {
      expect(hashKey(obj)).not.toEqual(hashKey(differentObj));
    });

    it("consistently hashes object", () => {
      expect(hashKey(obj)).toMatchSnapshot();
    });
  });

  describe("arrays", () => {
    const array = [
      { a: null, b: 3, c: false },
      { happiness: "low", sadness: "very" },
    ];

    const deepEqualArray = [
      { c: false, a: null, b: 3 },
      { sadness: "very", happiness: "low" },
    ];

    const notEqualArray = [
      { sadness: "very", happiness: "low" },
      { c: false, a: null, b: 3 },
    ];

    it("stringifies objects", () => {
      expect(stableStringKey(array))
        .toEqual("[{\"a\":null,\"b\":3,\"c\":false},{\"happiness\":\"low\",\"sadness\":\"very\"}]");
    });

    it("stringifies to match any deep equal array, regardless of order", () => {
      expect(stableStringKey(array)).toEqual(stableStringKey(deepEqualArray));
    });

    it("hashes the same arrays to the same hash", () => {
      expect(hashKey(array)).toEqual(hashKey(deepEqualArray));
    });

    it("does not match different array hashes", () => {
      expect(hashKey(array)).not.toEqual(hashKey(notEqualArray));
    });

    it("consistently hashes array", () => {
      expect(hashKey(array)).toMatchSnapshot();
    });
  });
});
