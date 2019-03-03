This is the main API Gateway implemented with Apollo Server. Most of the code is under `app`. See package.json for various scripts you can run.

We recommend looking at `app/schema` first to see the GraphQL types defined. Next, look at `app/resolvers/index` and across these files to see all of the code which actually fetches the data across resolver functions. Next, you can see the models that make this possible, which are made available to resolves with the `app/buildContext.js` helper.
