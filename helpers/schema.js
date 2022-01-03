const Joi = require('joi');

const userSchema = Joi.object().keys({
	email: Joi.string().email({ minDomainSegments: 2 }),
	password: Joi.string().required().min(4),
	confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
	referrer: Joi.string()
});

module.exports = {
	userSchema
};
