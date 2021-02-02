import React from 'react';
import './login.css';
import {Link} from 'react-router-dom';

const loginURL = 'http://192.168.0.121:5000/login';
const accountpage = 'http://192.168.0.121:3000/account';

class Login extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			username: '',
			password: '',
			displayError: 'none'
		};

		this.handleusername = this.handleusername.bind(this);
		this.handlepassword = this.handlepassword.bind(this);
		this.handleLogin = this.handleLogin.bind(this);

	}

	componentDidMount() {
		if (localStorage.getItem('userId') && localStorage.getItem('userAccessToken') && localStorage.getItem('username')) {
			window.location.href = accountpage;
		}
	}

	handleusername(e) {
		if (e.target.value !== '') {
			this.setState({
				username: e.target.value,
				displayError:'none'
			});
		}
	}

	handlepassword(e) {
		if (e.target.value !== '') {
			this.setState({
				password: e.target.value
			});
		}
	}

	async handleLogin() {
		if (this.state.username !== '' && this.state.password !== '') {
			let get = async () => await fetch(loginURL, {
				method:'POST',
				body: JSON.stringify({
					username: this.state.username,
					password: this.state.password
				}),
				headers: {
					'content-type':'application/json'
				}
			}).then(response => response.json()).then(data => {
				if (data.data === 'notfound') {
					this.setState({
						displayError: 'block'
					});
					const username = document.getElementById('username');
					const password = document.getElementById('password');

					username.value = '';
					password.value = '';

				} else if (data.data) {
					this.setState({
						displayError: 'none'
					});
					localStorage.setItem('userId', data.data.id);
					localStorage.setItem('username', data.data.username);
					localStorage.setItem('userAccessToken', data.data.accessToken);
					window.location.href = accountpage;
				}
			});
			await get();
		}
	}

	render() {
	return (
			<div className='main-container'>
				<h1>Login</h1>
				<form className='login-form' spellCheck='false'>
					<p style={{display: this.state.displayError, color:'red'}} >Incorrect username or password</p>

					<div className="input">
						<input id='username' type="text" name="username" autoComplete="off" required="required" onChange = {this.handleusername} />
						<label className="username" htmlFor="username"><span>Username</span> </label>
					</div>
					<br />
					<div className="input">
						<input id='password' type="password" name="password" autoComplete="off" required="required" onChange = {this.handlepassword} />
						<label className='password' htmlFor="password"><span>Password</span></label>
					</div>
					<br />
				</form>
				<br />

				<div>
					<button onClick={this.handleLogin} >Login</button>

					<p>&nbsp; or &nbsp;&nbsp;</p>

					<Link to='/signup' >
						<p className='signupButton' >Create a new account</p>
					</Link>

				</div>

			</div>
		);
	}
};



export default Login;




