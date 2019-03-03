import { GraphQLScalarType } from "graphql";

const URI = new GraphQLScalarType({
  name: "URI",
  serialize(value) {
    return value;
  },
});

export default URI;
