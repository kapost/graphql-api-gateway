import { cacheableResponse, withCacheHeaders } from "../cacheControl";

describe("cacheControl", () => {
  describe("#cacheableResponse", () => {
    function headers(cacheControl) {
      return {
        headers: {
          "cache-control": cacheControl,
        },
      };
    }

    it("respects private and does not cache as a proxy", () => {
      const cacheControl = "max-age=0, private, must-revalidate";
      expect(cacheableResponse(headers(cacheControl))).toBeFalse;
    });

    it("respects no-store and does not cache", () => {
      const cacheControl = "no-store, s-maxage=800";
      expect(cacheableResponse(headers(cacheControl))).toBeFalse;
    });

    it("does not cache if no Authorization-exempted directives are present", () => {
      const cacheControl = "no-cache, max-age=9000";
      expect(cacheableResponse(headers(cacheControl))).toBeFalse;
    });

    it("caches if must-revalidate is present", () => {
      const cacheControl = "max-age=0, must-revalidate, no-cache";
      expect(cacheableResponse(headers(cacheControl))).toBeTrue;
    });

    it("caches if public is present", () => {
      const cacheControl = "max-age=0, public, no-cache";
      expect(cacheableResponse(headers(cacheControl))).toBeTrue;
    });

    it("caches if s-maxage is present", () => {
      const cacheControl = "s-maxage=0, no-cache";
      expect(cacheableResponse(headers(cacheControl))).toBeTrue;
    });
  });

  describe("#withCacheHeaders", () => {
    it("adds If-Modified-Since if necessary", () => {
      const cache = { headers: { "last-modified": "X", other: "junk" } };

      expect(withCacheHeaders({ url: "/a" }, cache)).toEqual({
        url: "/a",
        headers: {
          "If-Modified-Since": "X",
        },
      });
    });

    it("adds If-None-Match if necessary", () => {
      const cache = { headers: { etag: "X", other: "junk" } };

      expect(withCacheHeaders({ url: "/a" }, cache)).toEqual({
        url: "/a",
        headers: {
          "If-None-Match": "X",
        },
      });
    });

    it("includes original requestConfig headers", () => {
      const cache = { headers: { "last-modified": "X", other: "junk" } };

      expect(withCacheHeaders({ url: "/a", headers: { secret: "header" } }, cache)).toEqual({
        url: "/a",
        headers: {
          secret: "header",
          "If-Modified-Since": "X",
        },
      });
    });
  });
});
