const express = require('express');
const prisma = require('../prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// Search users by email (for adding to projects)
router.get('/search', async (req, res, next) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Email query required' });

    const users = await prisma.user.findMany({
      where: {
        email: { contains: email, mode: 'insensitive' },
        id: { not: req.user.id } // Exclude self
      },
      select: { id: true, name: true, email: true },
      take: 5
    });

    res.json({ users });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
