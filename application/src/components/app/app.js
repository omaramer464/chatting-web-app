import React from 'react';

import {BrowserRouter as Router, Route} from 'react-router-dom';

import Login from '../login/login';
import Signup from '../signup/signup';
import Account from '../account/account';

export let ipAddress = '192.168.0.120';

const App = () => {
	return (
		<Router>
			<Route path='/' exact component={Login} />
			<Route path='/signup' component={Signup} />
			<Route path='/account' component={Account} />
		</Router>
	);
};

export default App;