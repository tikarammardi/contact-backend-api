const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();
const cors = require('cors');
const authRoutes = require('./routers/user');
const contactRoutes = require('./routers/contact');
const { validateToken } = require('./middlewares/validate-token');
require('./db/config').connectDB();

const app = express();
app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/ping', (req, res) => {
	return res.send({
		error: false,
		message: 'Server is running'
	});
});

app.use('/users', authRoutes);
app.use('/contacts', validateToken, contactRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
	console.info(`Server listining on port ${PORT}`);
});
