import { Router } from "express";
import { UsersController } from "./users.controller.js";
import { UsersService } from "./users.service.js";

const router = Router();

/* Dependency Injection Layer */
const service = new UsersService();
const controller = new UsersController(service);

router.get("/health", controller.health.bind(controller));

export default router;
