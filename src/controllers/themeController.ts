import { Request, Response } from 'express';
import AppTheme, { IAppTheme } from '../models/AppTheme';

// Get all themes
export const getThemes = async (req: Request, res: Response) => {
    try {
        const themes = await AppTheme.find();
        res.status(200).json(themes);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching themes', error });
    }
};

// Create a new theme
export const createTheme = async (req: Request, res: Response) => {
    try {
        const payload = req.body;

        // If this is set as the active festival theme, deactivate any others
        if (payload.type === 'festival' && payload.isActiveFestival) {
            await AppTheme.updateMany({ type: 'festival' }, { isActiveFestival: false });
        }

        const theme = await AppTheme.create(payload);
        res.status(201).json(theme);
    } catch (error) {
        res.status(500).json({ message: 'Error creating theme', error });
    }
};

// Update an existing theme
export const updateTheme = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const payload = req.body;

        if (payload.type === 'festival' && payload.isActiveFestival) {
            // Deactivate other festival themes
            await AppTheme.updateMany({ _id: { $ne: id as string }, type: 'festival' }, { isActiveFestival: false });
        }

        const updated = await AppTheme.findByIdAndUpdate(id, payload, { new: true });
        if (!updated) return res.status(404).json({ message: 'Theme not found' });

        res.status(200).json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Error updating theme', error });
    }
};

// Delete a theme
export const deleteTheme = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const deleted = await AppTheme.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ message: 'Theme not found' });

        res.status(200).json({ message: 'Theme deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting theme', error });
    }
};
