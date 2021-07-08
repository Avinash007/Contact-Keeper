const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const { check, validationResult } = require("express-validator");

const User = require("../models/User");

// @route       POST api/users
// @desc        Register a user
// @access      Public

router.post(
  "/",
  [
    check("name", "Please add name").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check(
      "password",
      "Please enter a password with 6 or more characters"
    ).isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      let user = await User.findOne({ email });

      if (user) {
        return res.status(400).json({ msg: "User already exists" });
      }

      // If new user, create a User model
      user = new User({
        name,
        email,
        password,
      });

      // Encrypt the password
      const salt = await bcrypt.genSalt(10); // Generate a salt
      user.password = await bcrypt.hash(password, salt); // Encrypt & save the password
      // Save the User to DB
      await user.save();

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
