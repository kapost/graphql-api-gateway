export class HTTPError extends Error {}

// We mimic the shape of an axios not found error when throwing ourselves.
export class NotFoundError extends HTTPError {
  constructor(message) {
    super(message);
    this.response = {
      status: 404,
      statusText: "Not Found",
    };
  }
}
