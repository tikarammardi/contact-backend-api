const ContactController = require('../controllers/contactController');
const express = require('express');
const router = express.Router();

const sanitize = require('../middlewares/sanitizer');

router.route('/').get(ContactController.getContact).post(sanitize, ContactController.addNewContact);

router
	.route('/contact/:contactId')
	.get(ContactController.getContactWithID)
	.put(sanitize, ContactController.updateContact)
	.delete(ContactController.deleteContact);

module.exports = router;
