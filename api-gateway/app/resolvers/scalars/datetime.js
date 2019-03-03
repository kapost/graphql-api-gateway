import { GraphQLScalarType } from "graphql";

const DateTime = new GraphQLScalarType({
  name: "DateTime",
  serialize(value) {
    return value;
  },
});

export default DateTime;
