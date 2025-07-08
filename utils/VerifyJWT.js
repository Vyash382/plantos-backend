const jwt = require('jsonwebtoken');
require('dotenv').config(); 

const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ type: false, message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); 
    req.user = decoded; 
    next();
  } catch (err) {
    return res.status(401).json({ type: false, message: 'Invalid token' });
  }
};
module.exports = { verifyJWT };