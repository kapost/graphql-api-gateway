import { GraphQLScalarType } from "graphql";

const Date = new GraphQLScalarType({
  name: "Date",
  serialize(value) {
    return value;
  },
});

export default Date;
