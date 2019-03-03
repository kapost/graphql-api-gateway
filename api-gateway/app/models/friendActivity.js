import memoizeByArgs from "utility/memoizeByArgs";
import newClass from "utility/newClass";

import { Service2Response } from "./responses/service2";

// Normally you wouldn't hardcode the host in: you would want to pull it by host settings
// or rely on a proxy to route under relative paths such as `/service1/api`.
// Since our basic example uses multiple localhost ports, we hardcode.
const INDEX_ENDPOINT = "http://localhost:3091/friend_activity/index";

export default class FriendActivity {
  constructor(connector) {
    this.connector = connector;
    this.index = memoizeByArgs(this.index);
  }

  index = () => {
    return (
      this.connector
        .get(INDEX_ENDPOINT)
        .then(newClass(Service2Response))
    );
  }
}
