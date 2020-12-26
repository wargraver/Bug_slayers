//This file contains signup,login and logout routes for User.................
const route = require('express').Router();
const bcrypt = require('bcrypt');
const { auth_user } = require('../auth/jwt_auth_user.js');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });
const { user, official, location, token } = require('../Database/modals.js');

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.key);

//desiging signup routes for user
route.post('/signup', async (req, res) => {
	const obj = req.body.object_user;
	try {
		const email = req.body.email;
		const password = req.body.password;
		const name = req.body.name;
		const phn_no = req.body.phn_no;
		//console.log(obj)
		//checking if any field is empty or not
		if (
			validator.isEmpty(email) ||
			validator.isEmpty(name) ||
			validator.isEmpty(password)
		) {
			obj.Error = 'Please enter all the fields';
			res.status(200).send(JSON.stringify(obj));
			return;
		}
		//checking whether email is valid
		if (validator.isEmail(email) === false) {
			obj.Error = 'Please enter valid email id';
			res.status(200).send(JSON.stringify(obj));
			return;
		}
		//checking if email is unique or not
		const data2 = await user.findOne({ email: email });
		if (data2 != null) {
			obj.Error = 'This Email is alreqady registered';
			res.status(200).send(JSON.stringify(obj));
			return;
		} else {
			//hashing the user password before stroing it to db
			const new_pass = await bcrypt.hash(password, 8);
			const new_user = new user({
				email: email,
				password: new_pass,
				name: name,
				phn_no: phn_no,
			});
			const saved_user = await new_user.save();
			obj.Email = saved_user.email;
			obj.Name = saved_user.name;
			obj.Requests = saved_user.points;
			obj.Message = 'User signed up successfully';
			obj.Phn_no = saved_user.phn_no;
			res.status(200).send(JSON.stringify(obj));
			//Sending mail to user for succesfull registration
			const user_email = saved_user.email;
		    const msg = {
			to: user_email,
			from: process.env.EMAIL_ID, // Use the email address or domain you verified above
			subject: 'Thanks for registering',
			text: 'and easy to do anywhere, even with Node.js',
			html: `<p>Thanks ${saved_user.name} for registering with us.</p><br>
			<p> Please report the Potholes around your locality</p><br>
			`,
		};
		sgMail.send(msg).then(
			() => {},
			(error) => {
				console.error(error);

				if (error.response) {
					console.error(error.response.body);
				}
			}
		);
			return;
		}
	} catch (err) {
		console.log(err);
		obj.Error = 'something went wrong while signing up user';
		res.status(504).send(JSON.stringify(obj));
	}
});
