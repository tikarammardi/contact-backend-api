const Contact = require('../models/Contact');

exports.addNewContact = async (req, res) => {
	const { id } = req.decoded;
	console.log('req body is', req.body);
	console.log('decoded id is', id);
	const payload = {
		full_name: req.body.full_name,
		email: req.body.email,
		phone: req.body.phone,
		user_id: id
	};
	const newContact = await new Contact(payload).save();
	if (!newContact) {
		return res.status(400).json({
			error: true,
			message: 'Failed to add new contact'
		});
	}

	return res.status(200).json({
		success: true,
		message: 'Contact added successfuly'
	});
};

exports.getContact = async (req, res) => {
	try {
		const contact = await Contact.find({});
		if (!contact) {
			return res.status(404).json({
				error: true,
				message: 'No contact found'
			});
		}

		return res.status(200).json({
			success: true,
			data: contact
		});
	} catch (error) {
		console.error('get contacts', error);
		return res.status(500).json({
			error: true,
			message: error.message
		});
	}
};

exports.getContactWithID = async (req, res) => {
	try {
		const contact = await Contact.findById({ _id: req.params.contactId });
		if (!contact) {
			return res.status(404).json({
				error: true,
				message: 'No contact found'
			});
		}

		return res.status(200).json({
			success: true,
			data: contact
		});
	} catch (error) {
		console.error('get contact with id', error);
		return res.status(500).json({
			error: true,
			message: error.message
		});
	}
};

exports.updateContact = async (req, res) => {
	try {
		const contact = await Contact.findOneAndUpdate({ _id: req.params.contactId }, req.body, { new: true });
		if (!contact) {
			return res.status(404).json({
				error: true,
				message: 'No contact found'
			});
		}

		return res.status(200).json({
			success: true,
			message: 'Contact updated sucessfully',
			data: contact
		});
	} catch (error) {
		console.error('get contacts', error);
		return res.status(500).json({
			error: true,
			message: error.message
		});
	}
};

exports.deleteContact = async (req, res) => {
	try {
		const contact = await Contact.deleteOne({ _id: req.params.contactId });

		if (!contact.deletedCount) {
			return res.status(404).json({
				error: true,
				message: 'No contact found'
			});
		}

		return res.status(200).json({
			success: true,
			message: 'Contact deleted sucessfully'
		});
	} catch (error) {
		console.error('delete contacts', error);
		return res.status(500).json({
			error: true,
			message: error.message
		});
	}
};
