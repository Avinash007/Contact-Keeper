const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { check, validationResult } = require("express-validator");

const User = require("../models/User");
const Contact = require("../models/Contact");

// @route       GET api/contacts
// @desc        Get all users contacts
// @access      Private
router.get("/", auth, async (req, res) => {
  try {
    // Get the contact of a particular user from their user id
    const contacts = await Contact.find({ user: req.user.id }).sort({
      date: -1,
    });
    res.json(contacts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route       POST api/contacts
// @desc        Add a new contact
// @access      Private
router.post(
  "/",
  [
    auth,
    [
      check("name", "Name is required").not().isEmpty(),
      check("email", "Please include a valid email").isEmail(),
    ],
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Pull out data from req.body
    const { name, email, phone, type } = req.body;

    try {
      // Create a new Contact
      const newContact = new Contact({
        name,
        email,
        phone,
        type,
        user: req.user.id,
      });

      // Save the Contact and return as Response
      const contact = await newContact.save();
      res.json(contact);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// @route       PUT api/contacts/:id
// @desc        Update a contact
// @access      Private
router.put("/:id", auth, async (req, res) => {
  const { name, email, phone, type } = req.body;

  // Create a contactFields object
  const contactFields = {};

  // If something is updated, we will add them to contactFields object
  if (name) contactFields.name = name;
  if (email) contactFields.email = email;
  if (phone) contactFields.phone = phone;
  if (type) contactFields.type = type;

  try {
    // Get the contact is exists
    let contact = await Contact.findById(req.params.id); // router.put("/:id")
    if (!contact) return res.status(404).json({ msg: "Contact not Found" }); // 404 is not found

    // Check if the user owns the contact. We do not want to update anybody else's contact
    if (contact.user.toString() !== req.user.id) {
      res.status(401).json({ msg: "Not Authorized " });
    }

    // Update the contact
    contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { $set: contactFields }, // set the contact field
      { new: true }
    ); // create a new contact if not exists

    res.json(contact);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route       DELETE api/contacts/:id
// @desc        Delete a contact
// @access      Private
router.delete("/:id", auth, async (req, res) => {
  try {
    // Get the contact is exists
    let contact = await Contact.findById(req.params.id); // router.put("/:id")
    if (!contact) return res.status(404).json({ msg: "Contact not Found" }); // 404 is not found

    // Check if the user owns the contact. We do not want to update anybody else's contact
    if (contact.user.toString() !== req.user.id) {
      res.status(401).json({ msg: "Not Authorized " });
    }

    // Delete the contact
    await Contact.findByIdAndRemove(req.params.id);

    res.json({ msg: "Contact Removed" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
