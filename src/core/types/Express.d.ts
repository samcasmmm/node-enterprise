import ResponseBuilder from "../response/response.builder.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        userName?: string;
        email?: string;
        tenantId?: number;
        organizationId?: number;
        branchId?: number;
        [key: string]: any;
      };
      tenant?: {
        tenantId?: number;
        organizationId?: number;
        branchId?: number;
      };
      db?: any;
    }

    interface Response {
      build: ResponseBuilder;
    }
  }
}

export { };
