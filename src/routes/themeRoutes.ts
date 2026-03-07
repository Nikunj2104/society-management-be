import express from 'express';
import { getThemes, createTheme, updateTheme, deleteTheme } from '../controllers/themeController';

const router = express.Router();

router.get('/', getThemes);
router.post('/', createTheme);
router.put('/:id', updateTheme);
router.delete('/:id', deleteTheme);

export default router;
