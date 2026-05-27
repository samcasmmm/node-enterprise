// core/base/response.builder.ts

import { formatTimestamp } from '@/shared/utils/date.util.js';
import { type Response } from "express";

type ErrorPayload = {
   code: string;
   details?: any;
};

class ResponseBuilder {
   private res: Response;

   private statusCode = 200;
   private isSuccess = true;
   private message = "Success";
   private data: any = null;
   private meta: any = null;
   private error: ErrorPayload | null = null;

   constructor(res: Response) {
      this.res = res;
   }

   withStatus(status: number): this {
      this.statusCode = status;
      return this;
   }

   success(): this {
      this.isSuccess = true;
      this.error = null;
      return this;
   }

   fail(): this {
      this.isSuccess = false;
      this.data = null;
      this.meta = null;
      return this;
   }

   withMessage(message: string): this {
      this.message = message;
      return this;
   }

   withData(data: any): this {
      this.data = data;
      return this;
   }

   withMeta(meta: any): this {
      this.meta = meta;
      return this;
   }

   withError(code: string, details: any = null): this {
      this.error = { code, details };
      return this;
   }
   send(): void {
      const base = {
         success: this.isSuccess,
         message: this.message,
         timestamp: formatTimestamp(new Date()),
      };

      if (this.isSuccess) {
         this.res.status(this.statusCode).json({
            ...base,
            data: this.data,
            ...(this.meta && { meta: this.meta }),
         });
      } else {
         this.res.status(this.statusCode).json({
            ...base,
            error: this.error,
         });
      }
   }
}

export default ResponseBuilder;