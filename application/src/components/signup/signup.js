import React from 'react';
import {Link} from 'react-router-dom';
import './signup.css';
import {ipAdress} from '../../../package.json';

const usernameURL = `http://${ipAdress}:5000/check/username`;
const emailURL = `http://${ipAdress}:5000/check/email`;
const signupURL = `http://${ipAdress}:5000/signup`;
const loginpageURL = `http://${ipAdress}:3000/`;
const accountpage = `http://${ipAdress}:3000/account`;

class Signup extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			username: '',
			password: '',
			email: '',
			firstName: '',
			lastName: '',
			usernamemessage:'',
			emailmessage:'',
			passwordmessage:'',
			firstNamemessage:'',
			lastNamemessage:''
		};

		this.handleUsernameChange = this.handleUsernameChange.bind(this);
		this.handleEmailChange = this.handleEmailChange.bind(this);
		this.handlePasswordChange = this.handlePasswordChange.bind(this);
		this.handleFirstNameChange = this.handleFirstNameChange.bind(this);
		this.handleLastNameChange = this.handleLastNameChange.bind(this);
		this.handleSingup = this.handleSingup.bind(this);
	}

	componentDidMount() {
		if (localStorage.getItem('userId')) {
			window.location.href = accountpage;
		}
	}

	async handleUsernameChange(e) {
		if (e.target.value !== '') {
			const usernamecheck = async () => await fetch(usernameURL, {
				method:'POST',
				body: JSON.stringify({username:e.target.value}),
				headers: {
					'content-type':'application/json'
				}
			}).then(response => response.json()).then(data => {
				if (data.data === 'exists') {
					this.setState({
						usernamemessage: 'username is already is use'
					});
				} else {
					this.setState({
						username : data.data.toString(),
						usernamemessage:''
					});
				}
			});
			await usernamecheck();
		} else {
			this.setState({
				usernamemessage:'* field is empty'
			});
		}
	}

	async handleEmailChange(e) {
		if (e.target.value !== '') {
			const emailcheck = async () => await fetch(emailURL, {
				method:'POST',
				body: JSON.stringify({email:e.target.value}),
				headers: {
					'content-type':'application/json'
				}
			}).then(response => response.json()).then(data => {
				if (data.data === 'exists') {
					this.setState({
						emailmessage: 'email is already is use'
					});
				} else {
					this.setState({
						email : data.data.toString(),
						emailmessage:''
					});
				}
			});
			await emailcheck();
		} else {
			this.setState({
				emailmessage:'* field is empty'
			});
		}
	}

	async handlePasswordChange(e) {
		if (e.target.value !== '' && e.target.value.length >= 7) {
			this.setState({
				password: e.target.value,
				passwordmessage:''
			});
		} else {
			this.setState({
				passwordmessage:'* password must be 7 or more characters'
			});
		}
	}

	async handleFirstNameChange(e) {
		if (e.target.value !== '') {
			this.setState({
				firstName: e.target.value,
				firstNamemessage:''
			});
		} else {
			this.setState({
				firstNamemessage:'* field is empty'
			});
		}
	}

	async handleLastNameChange(e) {
		if (e.target.value !== '') {
			this.setState({
				lastName: e.target.value,
				lastNamemessage:''
			});
		} else {
			this.setState({
				lastNamemessage:'* field is empty'
			});
		}
	}

	handleSingup() {
		if (this.state.username !== '' && this.state.email !== '' && this.state.password !== '' && this.state.firstName !== '' && this.state.lastName !== '') {
			fetch(signupURL, {
				method:'POST',
				body: JSON.stringify({
					username:this.state.username,
					email:this.state.email,
					password:this.state.password,
					firstName:this.state.firstName,
					lastName:this.state.lastName
				}),
				headers: {
					'content-type':'application/json'
				}
			}).then(response => {
				if (response.status === 200) {
					window.location.href = loginpageURL;
				} else if (response.status === 409) {
					console.log('nodemailer error contact support');
				}
			});
		} else {
			this.setState({
				usernamemessage:'* field is empty',
				emailmessage:'* field is empty',
				passwordmessage:'* field is empty',
				firstNamemessage:'* field is empty',
				lastNamemessage:'* field is empty'
			});
		}
	}


	render() {
		return (
			<div className='main-container'>
				<h1>Signup</h1>
				<form spellCheck='false'>
					<div className='input'>
						<input id='email' type="email" name="email" autoComplete="off" required="required" onBlur={this.handleEmailChange} />
						<label className="email" htmlFor="email"><span>Email</span> <span style={{color:'red'}}> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {this.state.emailmessage}</span></label>
					</div>
					<br />
					<div className='input'>
						<input id='username' type="text" name="username" autoComplete="off" required="required" onBlur={this.handleUsernameChange} />
						<label className="username" htmlFor="username"><span>Username</span><span style={{color:'red'}}> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {this.state.usernamemessage}</span></label>
					</div>
					<br />
					<div className="input">
						<input id='password' type="password" name="password" autoComplete="off" required="required" onBlur={this.handlePasswordChange} />
						<label className='password' htmlFor="password"><span>Password</span><span style={{color:'red'}}> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {this.state.passwordmessage}</span></label>
					</div>
					<br />
					<div className="input">
						<input id='firstname' type="text" name="firstname" autoComplete="off" required="required" onBlur={this.handleFirstNameChange} />
						<label className="firstname" htmlFor="firstname"><span>First name</span><span style={{color:'red'}}> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {this.state.firstNamemessage}</span></label>
					</div>
					<br />
					<div className="input">
						<input id='lastname' type="text" name="lastname" autoComplete="off" required="required" onBlur={this.handleLastNameChange} />
						<label className="lastname" htmlFor="lastname"><span>Last name</span><span style={{color:'red'}}> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {this.state.lastNamemessage}</span></label>
					</div>
					<br />
				</form>
				<br />

				<div>
					<button onClick={this.handleSingup} >Signup</button>

					<p>&nbsp; or &nbsp;&nbsp;</p>

					<Link to='/' >
						<p className='loginButton' >Log into an existing account</p>
					</Link>

				</div>

			</div>
		);
	}
};








export default Signup;


