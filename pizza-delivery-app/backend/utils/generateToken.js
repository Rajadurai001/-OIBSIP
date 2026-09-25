const jwt = require('jsonwebtoken');

// role is baked into the token itself so a user token can never be reused
// on an admin-only route and vice versa (checked in the middleware)
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

module.exports = generateToken;
