const express = require('express');
const { body } = require('express-validator');
const {
  getProjects, createProject, getProject,
  updateProject, deleteProject, addMember, removeMember
} = require('../controllers/projectController');
const { authenticate, requireProjectAdmin, requireProjectMember } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getProjects);

router.post('/', [
  body('name').trim().notEmpty().withMessage('Project name is required'),
  body('description').optional().trim()
], createProject);

router.get('/:projectId', requireProjectMember, getProject);

router.put('/:projectId', requireProjectAdmin, [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty')
], updateProject);

router.delete('/:projectId', requireProjectAdmin, deleteProject);

// Member management
router.post('/:projectId/members', requireProjectAdmin, [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('role').optional().isIn(['ADMIN', 'MEMBER']).withMessage('Role must be ADMIN or MEMBER')
], addMember);

router.delete('/:projectId/members/:userId', requireProjectAdmin, removeMember);

module.exports = router;
