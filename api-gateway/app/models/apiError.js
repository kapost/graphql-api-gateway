// Normally you wouldn't hardcode the host in: you would want to pull it by host settings
// or rely on a proxy to route under relative paths such as `/service1/api`.
// Since our basic example uses multiple localhost ports, we hardcode.
const ENDPOINT_400 = "http://localhost:3090/400";
const ENDPOINT_403 = "http://localhost:3090/403";
const ENDPOINT_404 = "http://localhost:3090/404";
const ENDPOINT_500 = "http://localhost:3090/500";

export default class ApiError {
  constructor(connector) {
    this.connector = connector;
  }

  test400 = () => {
    return this.connector.get(ENDPOINT_400);
  }

  test403 = () => {
    return this.connector.get(ENDPOINT_403);
  }

  test404 = () => {
    return this.connector.get(ENDPOINT_404);
  }

  test500 = () => {
    return this.connector.get(ENDPOINT_500);
  }
}
