import ResponseBuilder from "../response/response.builder.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        userName?: string;
        email?: string;
        tenantId?: string;
        organizationId?: string;
        branchId?: string;
        [key: string]: any;
      };
      tenant?: {
        tenantId?: string;
        organizationId?: string;
        branchId?: string;
      };
      db?: any;
    }

    interface Response {
      build: ResponseBuilder;
    }
  }
}

export { };
