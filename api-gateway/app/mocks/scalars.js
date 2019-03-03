import * as casual from "casual";

const scalars = {
  DateTime: () => casual.date("YYYY-MM-DDTHH:mm:ssZ"),
  Date: () => casual.date("YYYY-MM-DD"),
  URI: () => "https://example.com",
};

export default scalars;
