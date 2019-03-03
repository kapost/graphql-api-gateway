import memoizeByArgs from "utility/memoizeByArgs";
import newClass from "utility/newClass";

import { Service1Response } from "./responses/service1";

// Normally you wouldn't hardcode the host in: you would want to pull it by host settings
// or rely on a proxy to route under relative paths such as `/service1/api`.
// Since our basic example uses multiple localhost ports, we hardcode.
const SHOW_ENDPOINT = "http://localhost:3090/currentUser/show";

export default class CurrentUser {
  constructor(connector) {
    this.connector = connector;
    this.get = memoizeByArgs(this.get);
  }

  get = () => {
    return (
      this.connector
        .get(SHOW_ENDPOINT)
        .then(newClass(Service1Response))
    );
  }
}
