const { validationResult } = require('express-validator');
const prisma = require('../prisma/client');

// GET /api/projects — list all projects user belongs to
const getProjects = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } }
        ]
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } }
        },
        _count: { select: { tasks: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ projects });
  } catch (error) {
    next(error);
  }
};

// POST /api/projects — create project
const createProject = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description } = req.body;
    const userId = req.user.id;

    const project = await prisma.project.create({
      data: {
        name,
        description,
        ownerId: userId,
        members: {
          create: { userId, role: 'ADMIN' }
        }
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } }
        },
        _count: { select: { tasks: true } }
      }
    });

    res.status(201).json({ project });
  } catch (error) {
    next(error);
  }
};

// GET /api/projects/:projectId — get single project
const getProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } }
        },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true } },
            creator: { select: { id: true, name: true, email: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ project });
  } catch (error) {
    next(error);
  }
};

// PUT /api/projects/:projectId — update project (admin only)
const updateProject = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { projectId } = req.params;
    const { name, description } = req.body;

    const project = await prisma.project.update({
      where: { id: projectId },
      data: { name, description },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { tasks: true } }
      }
    });

    res.json({ project });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/projects/:projectId — delete project (admin only)
const deleteProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    await prisma.project.delete({ where: { id: projectId } });

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// POST /api/projects/:projectId/members — add member (admin only)
const addMember = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { email, role = 'MEMBER' } = req.body;

    const userToAdd = await prisma.user.findUnique({ where: { email } });
    if (!userToAdd) {
      return res.status(404).json({ error: 'User not found with that email' });
    }

    const existing = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: userToAdd.id, projectId } }
    });
    if (existing) {
      return res.status(400).json({ error: 'User is already a member' });
    }

    const membership = await prisma.projectMember.create({
      data: { userId: userToAdd.id, projectId, role },
      include: { user: { select: { id: true, name: true, email: true } } }
    });

    res.status(201).json({ membership });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/projects/:projectId/members/:userId — remove member (admin only)
const removeMember = async (req, res, next) => {
  try {
    const { projectId, userId } = req.params;

    // Can't remove project owner
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (project.ownerId === userId) {
      return res.status(400).json({ error: 'Cannot remove the project owner' });
    }

    await prisma.projectMember.delete({
      where: { userId_projectId: { userId, projectId } }
    });

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProjects, createProject, getProject, updateProject, deleteProject, addMember, removeMember };
