const jwt = require("jsonwebtoken");
const config = require("config");

module.exports = function (req, res, next) {
  // Move on to next api call
  // Get token from header
  const token = req.header("x-auth-token"); // this is the key

  // Check if not token
  if (!token) {
    // 401 response is unauthorized
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  try {
    // Decode the token with the secret
    const decoded = jwt.verify(token, config.get("jwtSecret"));

    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: "Token is not valid " });
  }
};
