import memoizeByArgs from "utility/memoizeByArgs";

import Response from "./response";

export class Service1Response extends Response {
  // We override the abstract Response class with our own path to camelized data.
  data = () => {
    return this.camelize().data.response;
  }
}

export class Service1PaginatedResponse extends Service1Response {
  constructor(...args) {
    super(...args);
    this.pagination = memoizeByArgs(this.pagination);
  }

  // Method to easily access pagination info in the shape of our GraphQL PageInfo schema.
  pagination = () => {
    const { pagination } = this.camelize.data();

    return {
      pageSize: pagination.pageSize,
      totalPages: pagination.totalPages,
      totalCount: pagination.total,
      previous: pagination.previousPage,
      current: pagination.current,
      next: pagination.nextPage,
      hasNextPage: Boolean(pagination.nextPage),
    };
  }
}

// We wrap up individual items from a MULTISHOW in a response object as well for consistency.
export class Service1ItemResponse extends Response {
  data = () => {
    return this.camelize().data;
  }
}
