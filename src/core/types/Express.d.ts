import { User } from "@/types/user";
import ResponseBuilder from "@/core/base/response.builder.js";
import { TenantConfig } from "@/shared/database/tenant-manager.js";

declare global {
  namespace Express {
    interface Request {
      user?: User;
      db?: any;
      tenant?: TenantConfig;
      tenantId?: number;
    }

    interface Response {
      build: ResponseBuilder;
    }
  }
}

export { };