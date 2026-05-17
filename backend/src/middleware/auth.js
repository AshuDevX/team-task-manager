const jwt = require('jsonwebtoken');
const prisma = require('../prisma/client');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    next(error);
  }
};

// Middleware to check if user is project admin
const requireProjectAdmin = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Owner is always admin
    if (project.ownerId === userId) {
      req.project = project;
      req.userRole = 'ADMIN';
      return next();
    }

    // Check membership role
    const membership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId, projectId } }
    });

    if (!membership || membership.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.project = project;
    req.userRole = 'ADMIN';
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware to check project membership (any role)
const requireProjectMember = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Owner has full access
    if (project.ownerId === userId) {
      req.project = project;
      req.userRole = 'ADMIN';
      return next();
    }

    // Check membership
    const membership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId, projectId } }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Not a project member' });
    }

    req.project = project;
    req.userRole = membership.role;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { authenticate, requireProjectAdmin, requireProjectMember };
