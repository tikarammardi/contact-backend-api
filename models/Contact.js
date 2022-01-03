const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ContactSchema = new Schema({
	user_id: {
		type: String,
		required: true
	},
	full_name: {
		type: String,
		required: true
	},

	email: {
		type: String,
		required: true
	},
	phone: {
		type: Number,
		required: true
	},

	created_date: {
		type: Date,
		default: Date.now
	}
});
const Contact = mongoose.model('contact', ContactSchema);
module.exports = Contact;
