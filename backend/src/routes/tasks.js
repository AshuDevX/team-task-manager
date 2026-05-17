const express = require('express');
const { body } = require('express-validator');
const { getDashboard, getProjectTasks, createTask, updateTask, deleteTask } = require('../controllers/taskController');
const { authenticate, requireProjectMember } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// Dashboard — personal task overview
router.get('/dashboard', getDashboard);

// Project-scoped task routes
router.get('/project/:projectId', requireProjectMember, getProjectTasks);

router.post('/project/:projectId', requireProjectMember, [
  body('title').trim().notEmpty().withMessage('Task title is required'),
  body('description').optional().trim(),
  body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'DONE']),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH']),
  body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
  body('assigneeId').optional().isString()
], createTask);

router.put('/project/:projectId/:taskId', requireProjectMember, updateTask);

router.delete('/project/:projectId/:taskId', requireProjectMember, deleteTask);

module.exports = router;
