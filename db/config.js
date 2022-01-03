const mongoose = require('mongoose');

const connectDB = async () => {
	try {
		await mongoose.connect(process.env.MONGO_URI, {
			dbName: 'contact_db',
			useNewUrlParser: true,
			useUnifiedTopology: true,
			useCreateIndex: true,
			useFindAndModify: false
		});
		console.log('Database connection Success.');
	} catch (error) {
		console.error('Mongo Connection Error', error);
	}
};

module.exports = {
	connectDB
};
