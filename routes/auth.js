const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const auth = require("../middleware/auth");
const { check, validationResult } = require("express-validator");

const User = require("../models/User");

// @route       GET api/auth
// @desc        Get logged in user
// @access      Private
router.get("/", auth, async (req, res) => {
  try {
    // Get the user from Mongoose DB by req user id
    // DO not get the password even if it is encrypted
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    console.log(err.message);
    res.status(500).send("Server error");
  }
});

// @route       POST api/auth
// @desc        Authenticate a user and get token
// @access      Public
router.post(
  "/",
  [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      let user = await User.findOne({ email });

      if (!user) {
        // User not found in DB
        return res.status(400).json({ msg: "Invalid Credentials" });
      }

      const isMatch = await bcrypt.compare(password, user.password); // 2nd param is DB

      if (!isMatch) {
        // Pwd incorrect in DB
        return res.status(400).json({ msg: "Invalid Credentials" });
      }

      // Get the ID of user to login
      const payload = {
        user: {
          id: user.id, // with id, we can fetch the contacts of this user
        },
      };

      jwt.sign(
        payload,
        config.get("jwtSecret"),
        { expiresIn: 360000 },
        (err, token) => {
          // After sign either throw an error or return token
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.err(err.message);
      res.status(500).send("Server error");
    }
  }
);

module.exports = router;
