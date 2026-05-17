const { validationResult } = require('express-validator');
const prisma = require('../prisma/client');

// GET /api/tasks/dashboard — get current user's dashboard stats
const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    const [myTasks, overdueTasks, projectCount, tasksByStatus] = await Promise.all([
      // Tasks assigned to me
      prisma.task.findMany({
        where: { assigneeId: userId },
        include: {
          project: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true } },
          creator: { select: { id: true, name: true } }
        },
        orderBy: { dueDate: 'asc' }
      }),
      // Overdue tasks
      prisma.task.count({
        where: {
          assigneeId: userId,
          status: { not: 'DONE' },
          dueDate: { lt: now }
        }
      }),
      // Projects I'm in
      prisma.project.count({
        where: {
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } }
          ]
        }
      }),
      // Tasks grouped by status
      prisma.task.groupBy({
        by: ['status'],
        where: { assigneeId: userId },
        _count: { status: true }
      })
    ]);

    const statusCounts = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
    tasksByStatus.forEach(s => { statusCounts[s.status] = s._count.status; });

    res.json({
      myTasks,
      stats: {
        totalTasks: myTasks.length,
        overdueTasks,
        projectCount,
        ...statusCounts
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/projects/:projectId/tasks — list tasks for a project
const getProjectTasks = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { status, priority, assigneeId } = req.query;

    const where = { projectId };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = assigneeId;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ tasks });
  } catch (error) {
    next(error);
  }
};

// POST /api/projects/:projectId/tasks — create task
const createTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { projectId } = req.params;
    const { title, description, status, priority, dueDate, assigneeId } = req.body;
    const userId = req.user.id;

    // Validate assignee is a project member
    if (assigneeId) {
      const member = await prisma.projectMember.findFirst({
        where: {
          projectId,
          userId: assigneeId
        }
      });
      if (!member) {
        return res.status(400).json({ error: 'Assignee must be a project member' });
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || 'TODO',
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        assigneeId: assigneeId || null,
        creatorId: userId
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } }
      }
    });

    res.status(201).json({ task });
  } catch (error) {
    next(error);
  }
};

// PUT /api/projects/:projectId/tasks/:taskId — update task
const updateTask = async (req, res, next) => {
  try {
    const { projectId, taskId } = req.params;
    const { title, description, status, priority, dueDate, assigneeId } = req.body;
    const userId = req.user.id;
    const userRole = req.userRole;

    const task = await prisma.task.findFirst({
      where: { id: taskId, projectId }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Members can only update status of their own tasks
    // Admins can update everything
    let updateData = {};

    if (userRole === 'ADMIN' || task.creatorId === userId) {
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (priority !== undefined) updateData.priority = priority;
      if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
      if (assigneeId !== undefined) updateData.assigneeId = assigneeId || null;
    }

    // Anyone assigned can update status
    if (status !== undefined) {
      updateData.status = status;
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } }
      }
    });

    res.json({ task: updatedTask });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/projects/:projectId/tasks/:taskId — delete task (admin or creator)
const deleteTask = async (req, res, next) => {
  try {
    const { projectId, taskId } = req.params;
    const userId = req.user.id;
    const userRole = req.userRole;

    const task = await prisma.task.findFirst({
      where: { id: taskId, projectId }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (userRole !== 'ADMIN' && task.creatorId !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this task' });
    }

    await prisma.task.delete({ where: { id: taskId } });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard, getProjectTasks, createTask, updateTask, deleteTask };
