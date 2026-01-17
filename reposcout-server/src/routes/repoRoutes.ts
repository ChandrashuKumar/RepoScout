import { Router, RequestHandler } from 'express';
import {
    getUserRepos,
    getRepoStatus,
    deleteRepo,
    getRepoGraph,
    getFileContent
} from '../controllers/repoController'; 
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticateToken, (getUserRepos as unknown) as RequestHandler);

router.get('/:repoId/status', authenticateToken, (getRepoStatus as unknown) as RequestHandler);

router.delete('/:repoId', authenticateToken, (deleteRepo as unknown) as RequestHandler);

router.get('/:repoId/graph', authenticateToken, (getRepoGraph as unknown) as RequestHandler);

router.get('/files/:fileId', authenticateToken, (getFileContent as unknown) as RequestHandler);


export default router;