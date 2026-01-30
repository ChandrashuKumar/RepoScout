import { Router } from "express";
import { chatWithRepo } from "../controllers/qaController";
import { authenticateToken } from "../middleware/authMiddleware";
const router = Router();

router.post("/:repoId", authenticateToken, chatWithRepo);

export default router;