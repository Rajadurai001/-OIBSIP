const asyncHandler = require('express-async-handler');
const Admin = require('../models/Admin');
const generateToken = require('../utils/generateToken');

// Admins are never created through public signup - only via the seed script
// or directly in the database. This keeps admin login fully separate from
// the user registration flow, as required by the spec.
// @desc  Admin login
// @route POST /api/admin/auth/login
const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const admin = await Admin.findOne({ email });
  if (!admin || !(await admin.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid admin credentials');
  }

  res.json({
    token: generateToken(admin._id, 'admin'),
    admin: { id: admin._id, name: admin.name, email: admin.email },
  });
});

// @desc  Get logged-in admin's profile
// @route GET /api/admin/auth/me
const getAdminMe = asyncHandler(async (req, res) => {
  res.json(req.admin);
});

module.exports = { loginAdmin, getAdminMe };
