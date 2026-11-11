const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const User = require('../models/User');
const { asyncHandler, parse, HttpError } = require('../errors');
const { signToken, requireAuth } = require('../middleware/auth');

const registerSchema = z.object({
  displayName: z.string().trim().min(1).max(60),
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9_.]{3,30}$/, '3-30 chars: letters, numbers, _ or .'),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
  role: z.enum(['listener', 'artist']).default('listener'),
});

const loginSchema = z.object({
  identifier: z.string().trim().toLowerCase().min(1), // username or email
  password: z.string().min(1),
});

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const data = parse(registerSchema, req.body);
    const exists = await User.exists({ $or: [{ email: data.email }, { username: data.username }] });
    if (exists) throw new HttpError(409, 'That username or email is already taken');
    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await User.create({ ...data, passwordHash });
    res.status(201).json({ user, token: signToken(user) });
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { identifier, password } = parse(loginSchema, req.body);
    const user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] }).select('+passwordHash');
    // same message for unknown user and wrong password, so accounts can't be enumerated
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new HttpError(401, 'Incorrect username/email or password');
    }
    res.json({ user, token: signToken(user) });
  })
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) throw new HttpError(401, 'Account no longer exists');
    res.json({ user });
  })
);

module.exports = router;
