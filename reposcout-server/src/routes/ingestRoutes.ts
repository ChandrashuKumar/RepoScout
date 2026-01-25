import { Router } from "express";
import { ingestRepo, streamIngestionProgress } from "../controllers/ingestController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

router.post("/", authenticateToken, ingestRepo);
router.get("/:repoId/progress", authenticateToken, streamIngestionProgress);

export default router;