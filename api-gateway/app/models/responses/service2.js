import memoizeByArgs from "utility/memoizeByArgs";

import Response from "./response";

export class Service2Response extends Response {
  // We override the abstract Response class with our own path to camelized data.
  data = () => {
    // note: first .data comes from axios, second from our response object in service2/api.js
    return this.camelize().data.data;
  }
}
