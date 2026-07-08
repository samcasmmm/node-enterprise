import ResponseBuilder from "../response/response.builder.js";

declare global {
  namespace Express {
    interface Request {
      user?: any;
      db?: any;
    }

    interface Response {
      build: ResponseBuilder;
    }
  }
}

export { };
