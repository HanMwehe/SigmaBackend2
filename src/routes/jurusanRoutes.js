import express from 'express';
import {
  getAllJurusan,
  createJurusan,
  getJurusanById,
} from '../controller/jurusanController.js';
import { verifyToken, allowRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', verifyToken, allowRoles('admin', 'dosen', 'mahasiswa'), getAllJurusan);
router.post('/', verifyToken, allowRoles('dosen'), createJurusan);
router.get('/:id', verifyToken, allowRoles('admin', 'dosen'), getJurusanById);

export default router;
