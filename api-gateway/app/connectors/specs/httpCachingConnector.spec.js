import HTTPCachingConnector from "../httpCachingConnector";

describe("HTTPCachingConnector", () => {
  class MockCache {
    constructor() {
      this.inMemory = {};
    }

    get(key) {
      return Promise.resolve(JSON.parse(this.inMemory[key] || null));
    }

    set(key, value) {
      this.inMemory[key] = JSON.stringify(value);
      return Promise.resolve();
    }
  }

  class MockLogger {
    info() {}
  }

  function createMockApi(returnValue, error = false) {
    return {
      request: jest.fn().mockImplementation(() => {
        const response = {
          headers: {},
          config: {
            url: "test.com",
          },
          ...returnValue,
        };

        const err = new Error("fake api failure");
        err.response = response;
        err.config = {
          url: "test.com",
        };
        return error ? Promise.reject(err) : Promise.resolve(response);
      }),
    };
  }

  const graphqlRequestConfig = {
    origin: "https://test.example.com",
    authHeaders: {
      Authorization: "secrets",
    },
    other: "config",
  };

  it("does not do caching on non-GET requests", async () => {
    expect.assertions(2);

    const response = {
      status: 200,
      headers: {
        "cache-control": "max-age=0, must-revalidate",
      },
    };

    const mockApi = createMockApi(response);
    const setSpy = jest.spyOn(MockCache.prototype, "set");

    const subject = new HTTPCachingConnector(graphqlRequestConfig, {
      Cache: MockCache,
      logger: new MockLogger(),
      createAxiosInstance: () => mockApi,
    });

    await subject.request({ url: "/a", method: "post" });

    expect(setSpy).not.toHaveBeenCalled();
    expect(mockApi.request).toHaveBeenCalledWith({
      url: "/a",
      method: "post",
    });
  });

  describe("Axios-like API", () => {
    let requestSpy;
    let subject;

    beforeEach(() => {
      requestSpy = jest.fn().mockImplementation(x => x);
      subject = new HTTPCachingConnector(graphqlRequestConfig);
      subject.request = requestSpy;
    });

    it("default args", () => {
      expect(subject.get("/yawn")).toEqual({ url: "/yawn" });
      expect(subject.post("/yawn")).toEqual({ url: "/yawn", method: "post" });
      expect(subject.put("/yawn")).toEqual({ url: "/yawn", method: "put" });
      expect(subject.delete("/yawn")).toEqual({ url: "/yawn", method: "delete" });
    });

    it("#get", () => {
      subject.get("/yawn", { data: "x", method: "get" });

      expect(requestSpy).toHaveBeenCalledWith({
        url: "/yawn",
        data: "x",
      });
    });

    it("#post", () => {
      subject.post("/yawn", { data: "x" });

      expect(requestSpy).toHaveBeenCalledWith({
        url: "/yawn",
        method: "post",
        data: "x",
      });
    });

    it("#put", () => {
      subject.put("/yawn", { data: "x" });

      expect(requestSpy).toHaveBeenCalledWith({
        url: "/yawn",
        method: "put",
        data: "x",
      });
    });

    it("#delete", () => {
      subject.delete("/yawn", { data: "x" });

      expect(requestSpy).toHaveBeenCalledWith({
        url: "/yawn",
        method: "delete",
        data: "x",
      });
    });
  });

  describe("with cache miss", () => {
    it("requests", async () => {
      expect.assertions(1);

      const mockApi = createMockApi({
        status: 200,
      });

      const subject = new HTTPCachingConnector(graphqlRequestConfig, {
        Cache: MockCache,
        logger: new MockLogger(),
        createAxiosInstance: () => mockApi,
      });

      await subject.request({ url: "/a" });

      expect(mockApi.request).toHaveBeenCalledWith({ url: "/a", headers: {} });
    });

    it("caches with 200 and headers allow", async () => {
      expect.assertions(1);

      const response = {
        status: 200,
        headers: {
          "cache-control": "max-age=0, must-revalidate",
        },
      };

      const mockApi = createMockApi(response);
      const setSpy = jest.spyOn(MockCache.prototype, "set");

      const subject = new HTTPCachingConnector(graphqlRequestConfig, {
        Cache: MockCache,
        logger: new MockLogger(),
        createAxiosInstance: () => mockApi,
      });

      await subject.request({ url: "/a" });

      expect(setSpy).toHaveBeenCalledWith("379e5641163430a98252a0fdfee54510", response);
    });

    it("does not cache with 200 when headers do not allow", async () => {
      expect.assertions(2);

      const response = {
        status: 200,
        headers: {
          "cache-control": "max-age=0, private",
        },
      };

      const mockApi = createMockApi(response);
      const setSpy = jest.spyOn(MockCache.prototype, "set");

      const subject = new HTTPCachingConnector(graphqlRequestConfig, {
        Cache: MockCache,
        logger: new MockLogger(),
        createAxiosInstance: () => mockApi,
      });

      await subject.request({ url: "/a" });

      expect(mockApi.request).toHaveBeenCalled();
      expect(setSpy).not.toHaveBeenCalled();
    });

    it("does not cache when not successful", async () => {
      expect.assertions(2);

      const response = {
        status: 404,
        headers: {
          "cache-control": "max-age=0, must-revalidate",
        },
      };

      const mockApi = createMockApi(response, true);
      const setSpy = jest.spyOn(MockCache.prototype, "set");

      const subject = new HTTPCachingConnector(graphqlRequestConfig, {
        Cache: MockCache,
        logger: new MockLogger(),
        createAxiosInstance: () => mockApi,
      });

      await subject.request({ url: "/a" }).catch((err) => {
        if (!err.response && err.response.status !== 404) {
          throw err;
        }
      });

      expect(mockApi.request).toHaveBeenCalled();
      expect(setSpy).not.toHaveBeenCalled();
    });
  });

  describe("with cache hit", () => {
    let subject;
    let getSpy;
    let mockApi;
    let response;
    let cachedResponse;

    beforeEach(() => {
      response = {
        status: 304,
        headers: {
          "cache-control": "max-age=0, must-revalidate",
        },
      };

      cachedResponse = {
        status: 200,
        headers: {
          "last-modified": "X",
          etag: "Y",
        },
        response: "hey",
      };

      mockApi = createMockApi(response, true);
      getSpy = jest.spyOn(MockCache.prototype, "get").mockReturnValue(cachedResponse);

      subject = new HTTPCachingConnector(graphqlRequestConfig, {
        Cache: MockCache,
        logger: new MockLogger(),
        createAxiosInstance: () => mockApi,
      });
    });

    it("always requests to ensure 304 / auth", async () => {
      expect.assertions(2);
      await subject.request({ url: "/a" });

      expect(getSpy).toHaveBeenCalledWith("379e5641163430a98252a0fdfee54510");
      expect(mockApi.request).toHaveBeenCalledWith({
        url: "/a",
        headers: {
          "If-Modified-Since": "X",
          "If-None-Match": "Y",
        },
      });
    });

    it("returns cached result", async () => {
      expect.assertions(1);

      const result = await subject.request({ url: "/a" });
      expect(result).toEqual(cachedResponse);
    });
  });
});
