import { parseOperationName } from "../responseTracking";

describe("responseTracking", () => {
  describe("parseQueryType", () => {
    it("works without arguments", () => {
      expect(
        parseOperationName("query SummerTimeFunTime {\nid\n}")
      ).toEqual("SummerTimeFunTime");

      expect(
        parseOperationName("query SummerTimeFunTime\n{\nid\n}")
      ).toEqual("SummerTimeFunTime");

      expect(
        parseOperationName("query SummerTimeFunTime{\nid\n}")
      ).toEqual("SummerTimeFunTime");
    });

    it("works with arguments", () => {
      expect(
        parseOperationName("query SummerTimeFunTime(id: $id) {\nid\n}")
      ).toEqual("SummerTimeFunTime");

      expect(
        parseOperationName("query SummerTimeFunTime\n(\nid: $id\n)\n {\nid\n}")
      ).toEqual("SummerTimeFunTime");
    });

    it("works with different query types", () => {
      expect(parseOperationName("mutation Dinkleberg {\nid\n}")).toEqual("Dinkleberg");
      expect(parseOperationName("subscription Chet {\nid\n}")).toEqual("Chet");
    });
  });
});
