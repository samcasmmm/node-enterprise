import type { Request, Response } from "express";
import type { UsersService } from "./users.service.js";

export class UsersController {
  constructor(private readonly service: UsersService) {}

  async health(req: Request, res: Response) {
    const data = await this.service.health();
    res.json({
      module: "users",
      status: "ok",
      data,
    });
  }
}
