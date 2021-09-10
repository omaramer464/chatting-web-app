import React from 'react';
import './account.css';
import Chat from '../chat/chat';
import Friends from '../friends/friends';
import {ipAdress} from '../../../package.json';

const loginpage = `http://${ipAdress}:3000`;
const checkURL2 = `http://${ipAdress}:5000/account/get/refresh`;
const deleteAccount = `http://${ipAdress}:5000/account/delete`;
const changeimgURL = `http://${ipAdress}:5000/account/profileimg/change`;
const loadimg = `http://${ipAdress}:5000/account/profileimg`;
const removeimg = `http://${ipAdress}:5000/account/profileimg/remove`;
const checkusername = `http://${ipAdress}:5000/account/change/username`;
const checkpassword = `http://${ipAdress}:5000/account/change/password`;
const searchURL = `http://${ipAdress}:5000/account/search`;
const getchats = `http://${ipAdress}:5000/account/chats`;
const sendRequest = `http://${ipAdress}:5000/account/friends/sendRequest`;
const cancelRequest = `http://${ipAdress}:5000/account/friends/cancelRequest`;

class Account extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			showSettings: false
		};

		this.toggleSettings = this.toggleSettings.bind(this);
		this.closeSettings = this.closeSettings.bind(this);

	}

	componentDidMount() {
		if (localStorage.getItem('userId') && localStorage.getItem('userAccessToken') && localStorage.getItem('username')) {
			fetch(checkURL2, {
				method: 'POST',
				body: JSON.stringify({
					id: localStorage.getItem('userId'),
					accessToken: localStorage.getItem('userAccessToken'),
					username: localStorage.getItem('username')
				}),
				headers: {
					'content-type':'application/json'
				}
			}).then(response => {
				if (response.status === 409) {
					localStorage.removeItem('userId');
					localStorage.removeItem('userAccessToken');
					localStorage.removeItem('username');
					window.location.href = loginpage;
				}
			});
		} else {
			window.location.href = loginpage;
		}
	}

	toggleSettings() {
		const settingsMenu = document.querySelector('.settings-menu');
		if (this.state.showSettings) {
			settingsMenu.style.transform = 'translateX(-100%)';
			this.setState({
				showSettings: false
			});
		} else {
			settingsMenu.style.transform = 'translateX(0%)';
			this.setState({
				showSettings: true
			});
		}
	}

	closeSettings(e) {
		const settingsMenu = document.querySelector('.settings-menu');
		if (e.target.className === 'settings-menu' || e.target.className === 'profileimg' || e.target.className === 'username' || e.target.className === 'settings-buttons' || e.target.className === 'changeprofileimg' || e.target.className === 'buttons' || e.target.className === 'removeprofileimg' || e.target.className === 'changeU' || e.target.className === 'changeP' || e.target.className === 'logout-delete' || e.target.className === 'logout' || e.target.className === 'delete') {
		} else {
			if (this.state.showSettings) {
				settingsMenu.style.transform = 'translateX(-100%)';
				this.setState({
					showSettings: false
				});
			}
		}
	}

	render() {
		return (
			<div className='body' onClick={this.closeSettings} >
				<Header toggleSettings={this.toggleSettings} />
				<Settings />
				<Body />
			</div>
		);
	}
};

///

class Header extends React.Component {
	render() {
		return (
			<div className="header" >
				<div className='burger' onClick={this.props.toggleSettings} >
					<div className='burger1' ></div>
					<div className='burger2' ></div>
					<div className='burger3' ></div>
				</div>
				<h1>ChitChat</h1>
			</div>
		);
	}
};


class Settings extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			username: localStorage.getItem('username')
		};
	}

	componentDidMount() {
		const img = document.querySelector('.profileimg');
		fetch(loadimg, {
			method:'POST',
			body: JSON.stringify({
				id: localStorage.getItem('userId')
			}),
			headers: {
				'content-type':'application/json'
			}
		}).then(response => response.json()).then(data => {
			if (data.data === '0') {
				img.setAttribute('src', './default-image.jpg');
			} else {
				img.setAttribute('src', data.data);
			}
		});
	}

	logout() {
		localStorage.removeItem('userId');
		localStorage.removeItem('userAccessToken');
		localStorage.removeItem('username');
		window.location.href = loginpage;
	}

	delete() {
		fetch(deleteAccount, {
			method:'DELETE',
			body: JSON.stringify({
				id: localStorage.getItem('userId')
			}),
			headers: {
				'content-type':'application/json'
			}
		});
		localStorage.removeItem('userId');
		window.location.href = loginpage;
	}

	changeprofileimg(e) {
		const img = document.querySelector('.profileimg');
		const file = e.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.addEventListener('load', () => {
				fetch(changeimgURL, {
					method:'PUT',
					body: JSON.stringify({
						id: localStorage.getItem('userId'),
						img: reader.result
					}),
					headers: {
						'content-type':'application/json'
					}
				}).then(response => response.json()).then(data => {
					img.setAttribute('src', data.data);
					// img.style.background = 'url("' + data.data + '")';
				});
				
			});
			reader.readAsDataURL(file);
		}
	}

	async removeprofileimg() {
		const img = document.querySelector('.profileimg');
		await fetch(removeimg, {
			method:'PUT',
			body:JSON.stringify({
				id: localStorage.getItem('userId')
			}),
			headers: {
				'content-type':'application/json'
			}
		}).then(response => response.json()).then(data => {
			if (data.data === 'removed') {
				img.setAttribute('src', './default-image.jpg');
			}
		});
	}

	changeusername() {
		const usernamePanel = document.querySelector('.changeusername-background');
		usernamePanel.style.display = 'block';
	}

	changepassword() {
		const passwordPanel = document.querySelector('.changepassword-background');
		passwordPanel.style.display = 'block';
	}

	render() {
		return (
			<div className='settings-menu'>
				<img className='profileimg' src='' alt='' />
				<h1 className='username' >{this.state.username}</h1>
				<div className='settings-buttons' >
					<label className='changeprofileimg' htmlFor="profileimg">change profile picture<input onChange={this.changeprofileimg} type="file" id="profileimg" name="profileimg" accept="image/*" /></label>
					<div className='buttons'>
						<button className='removeprofileimg' onClick={this.removeprofileimg} >remove profile picture</button>
						<button className='changeU' onClick={this.changeusername} >change username</button>
						<button className='changeP' onClick={this.changepassword} >change password</button>
					</div>
					<div className='logout-delete'>
						<button className='logout' onClick={this.logout} >logout</button>
						<button className='delete' onClick={this.delete} >delete account</button>
					</div>
				</div>
			</div>
		);
	}
}

///

class Body extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			usernameResponse:'',
			usernameResponseColor:'',
			passwordResponse:'',
			passwordResponseColor:'',
			renderFriends:false,
			renderSearch:true,
			renderChats:false
		};

		this.closePanel = this.closePanel.bind(this);
		this.usernamechange = this.usernamechange.bind(this);
		this.passwordchange = this.passwordchange.bind(this);
		this.inputfocus = this.inputfocus.bind(this);
		this.showChats = this.showChats.bind(this);
		this.showFriends = this.showFriends.bind(this);
		this.showSearch = this.showSearch.bind(this);
	}

	closePanel(e) {
		const usernamePanel = document.querySelector('.changeusername-background');
		const passwordPanel = document.querySelector('.changepassword-background');
		const usernameInput = document.querySelector('.usernameInput');
		const passwordInput = document.querySelector('.passwordInput');
		const oldpasswordInput = document.querySelector('.oldpasswordInput');

		if (e.target.className === 'close-change-username') {
			this.setState({
				usernameResponse:'',
				usernameResponseColor:''
			});
			usernamePanel.style.display = 'none';
			usernameInput.value = '';
		} else if (e.target.className === 'close-change-password') {
			this.setState({
				passwordResponse:'',
				passwordResponseColor:''
			});
			passwordPanel.style.display = 'none';
			passwordInput.value = '';
			oldpasswordInput.value = '';
		}
	}

	usernamechange() {
		const input = document.querySelector('.usernameInput');
		fetch(checkusername, {
			method:'PUT',
			body: JSON.stringify({
				username: input.value,
				id: localStorage.getItem('userId')
			}),
			headers: {
				'content-type':'application/json'
			}
		}).then(response => response.json()).then(data => {
			if (data.data === 'exists') {
				this.setState({
					usernameResponse: 'username already exists',
					usernameResponseColor:'red'
				});
				input.value = '';
			} else if (data.data === 'allgood') {
				this.setState({
					usernameResponse: 'username changed',
					usernameResponseColor:'green'
				});
				input.value = '';
			} else if (data.data === 'invalid') {
				this.setState({
					usernameResponse: 'username can not be empty',
					usernameResponseColor: 'red'
				});
			}
		});
	}

	passwordchange() {
		const oldinput = document.querySelector('.oldpasswordInput');
		const input = document.querySelector('.passwordInput');
		fetch(checkpassword, {
			method:'PUT',
			body: JSON.stringify({
				id: localStorage.getItem('userId'),
				oldpassword: oldinput.value,
				newpassword: input.value
			}),
			headers: {
				'content-type':'application/json'
			}
		}).then(response => response.json()).then(data => {
			if (data.data === 'incorrect') {
				this.setState({
					passwordResponse:'old password is not correct',
					passwordResponseColor:'red'
				});
				oldinput.value = '';
				input.value = '';
			} else if (data.data === 'allgood') {
				this.setState({
					passwordResponse:'password changed',
					passwordResponseColor:'green'
				});
				oldinput.value = '';
				input.value = '';
			} else if (data.data === 'invalid') {
				this.setState({
					passwordResponse:'password can not be empty or same as old password',
					passwordResponseColor:'red'
				});
				oldinput.value = '';
				input.value = '';
			} else if (data.data === 'weak') {
				this.setState({
					passwordResponse:'password must be 7 or more characters',
					passwordResponseColor:'red'
				});
				oldinput.value = '';
				input.value = '';
			}
		});
	}

	inputfocus() {
		this.setState({
			usernameResponse:'',
			usernameResponseColor:'',
			passwordResponse:'',
			passwordResponseColor:''
		});
	}

	async showChats() {

		this.setState({
			renderFriends:false,
			renderSearch:false,
			renderChats:true
		});

		const chatButton = document.querySelector('.chatButton');
		const searchButton = document.querySelector('.searchButton');
		const friendsButton = document.querySelector('.friendsButton');

		chatButton.style.color = '#00ffbc';
		searchButton.style.color = 'white';
		friendsButton.style.color = 'white';
	}

	showFriends() {
		this.setState({
			renderFriends:true,
			renderSearch:false,
			renderChats:false
		});

		const chatButton = document.querySelector('.chatButton');
		const searchButton = document.querySelector('.searchButton');
		const friendsButton = document.querySelector('.friendsButton');

		chatButton.style.color = 'white';
		searchButton.style.color = 'white';
		friendsButton.style.color = '#00ffbc';
	}

	showSearch() {
		this.setState({
			renderFriends:false,
			renderSearch:true,
			renderChats:false
		});

		const chatButton = document.querySelector('.chatButton');
		const searchButton = document.querySelector('.searchButton');
		const friendsButton = document.querySelector('.friendsButton');

		chatButton.style.color = 'white';
		searchButton.style.color = '#00ffbc';
		friendsButton.style.color = 'white';
	}

	render() {
		return (
			<div className='body-body'>
				<Nav chating={this.showChats} search={this.showSearch} friends={this.showFriends} />
				<div className='changeusername-background' >
					<div className='changeusername'>
						<button onClick={this.closePanel} className="close-change-username"><i className="fa fa-times" aria-hidden="true"></i></button>
						<label style={{color:'white'}} htmlFor='changeusername' >New Username</label>
						<input onFocus={this.inputfocus} className='usernameInput' type='text' name='changeusername' />
						<p style={{color:this.state.usernameResponseColor}} className='usernameResponse' >{this.state.usernameResponse}</p>
						<button onClick={this.usernamechange} className='confirm' >Confirm</button>
					</div>
				</div>
				<div className="changepassword-background" >
					<div className='changepassword'>
						<button onClick={this.closePanel} className="close-change-password"><i className="fa fa-times" aria-hidden="true"></i></button>
						<label style={{color:'white'}} htmlFor='checkpassword' >Old Password &nbsp;</label>
						<input onFocus={this.inputfocus} className='oldpasswordInput' type='password' name='checkpassword' />
						<br />
						<label style={{color:'white'}} htmlFor='changepassword' >New Password</label>
						<input onFocus={this.inputfocus} className='passwordInput' type='password' name='changepassword' />
						<p style={{color:this.state.passwordResponseColor}} className='passwordResponse' >{this.state.passwordResponse}</p>
						<button onClick={this.passwordchange} className='confirm' >Confirm</button>
					</div>
				</div>
				{this.state.renderSearch && <SearchBar />}
				{this.state.renderChats && <Chating />}
				{this.state.renderFriends && <Friends />}
			</div>
		);
	}
}

///

class Nav extends React.Component {
	render() {
		return (
			<div className='navigation-div' >
				<nav className='navigation' >
					<button onClick={this.props.chating} className='chatButton' >Chats</button>
					<button onClick={this.props.search} className="searchButton">Search</button>
					<button onClick={this.props.friends} className='friendsButton' >Friends</button>
				</nav>
			</div>
		);
	}
};

class Chating extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			chats: [],
			showNoChat: 'block',
			chatId: '',
			img: '',
			showChat: false
		};

		this.changeChat = this.changeChat.bind(this);
		this.closeChat = this.closeChat.bind(this);
	}

	componentDidMount() {
		fetch(getchats, {
			method:'POST',
			body: JSON.stringify({
				id: localStorage.getItem('userId'),
				accessToken: localStorage.getItem('userAccessToken')
			}),
			headers: {
				'content-type':'application/json'
			}
		}).then(response => response.json()).then(data => {
			if (data.data === 'notfound') {
				this.setState({
					showNoChat:'block'
				})
			} else if (data.data) {
				this.setState({
					chats: data.data,
					showNoChat:'none',
					chatId: data.data[0].chatId,
					img: data.data[0].img
				});
			}
		});
	}
	

	changeChat(e) {
		this.setState({
			chatId: e.target.id,
			img: e.target.children[0].src,
			showChat: true
		});
	}

	closeChat() {
		this.setState({
			showChat: false
		});
	}

	render() {
		return (
			<div>
				<div className='chats-window'>
					<div className='chats'>
						<p style={{color:'white', display:this.state.showNoChat, textAlign:'center'}} >No chats available</p>
						{
							this.state.chats.map(chat => {
								let img;
								let lasttext;

								if (chat.img === '0') {
									img = './default-image.jpg';
								} else {
									img = chat.img;
								}

								if (chat.sentby === 'me') {
									lasttext = `You: ${chat.lasttext}`;
								} else {
									lasttext = `${chat.lasttext}`;
								}

								return <ChatItem showChat={(e) => this.changeChat(e)} key={chat.username} chatId={chat.chatId} username={chat.username} img={img} lasttext={lasttext} />
							})
						}
					</div>
				</div>
				{this.state.showChat && <Chat chatId={this.state.chatId} img={this.state.img} closeChat={this.closeChat} />}
			</div>
		);
	}
};
///

class ChatItem extends React.Component {
	render() {
		return (
			<div onClick={(e) => this.props.showChat(e)} id={this.props.chatId} className='chatItem-box' >
				<img src={this.props.img} alt='' />
				<h1>{this.props.username}</h1>
				<p>{this.props.lasttext}</p>
			</div>
		);
	}
};

class SearchBar extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			usernames:[]
		};
		this.search = this.search.bind(this);
	}

	goup() {
		const searchContainer = document.querySelector('.search-bar-container');
		const results = document.querySelector('.results');
		const searchbar = document.querySelector('.search-bar');
		searchContainer.style.transform = 'translateY(-250%)';
		searchbar.style.border = '2px solid #00ffbc';
		setTimeout(function() {results.style.display = 'block'}, 500)
	}

	goback() {
		const searchbar = document.querySelector('.search-bar');
		searchbar.style.border = '2px solid white';
	}

	async search(e) {
		if (e.target.value !== '') {
			await fetch(searchURL, {
				method:'POST',
				body: JSON.stringify({
					id: localStorage.getItem('userId'),
					username: e.target.value
				}),
				headers: {
					'content-type':'application/json'
				}
			}).then(response => response.json()).then(data => {
				if (data.data === 'notfound') {
					this.setState({
						usernames: []
					});
				} else if (data.data) {
					this.setState({
						usernames:data.data
					});
				}
			});
		} else {
			this.setState({
				usernames:[]
			});
		}
	}

	render() {
		return (
			<div className='search-bar&search-results'>
				<div className='search-bar-container'>
					<div className='search-bar'>
						<input onBlur={this.goback} onChange={this.search} onFocus={this.goup} className="search-field" type="text" name="search" placeholder="Search" spellCheck="false" />
					</div>
				</div>
				<SearchResults usernames={this.state.usernames} />
			</div>
		);
	}
};

///

class SearchResults extends React.Component {
	close() {
		const searchContainer = document.querySelector('.search-bar-container');
		const results = document.querySelector('.results');
		const searchField = document.querySelector('.search-field');
		searchContainer.style.transform = 'translateY(0%)';
		searchField.value = '';
		results.style.display = 'none';
	}

	render() {
		return (
			<div className="results">
				<button onClick={this.close} className="close-results"><i className="fa fa-times" aria-hidden="true"></i></button>
				<div className="results-div">
					{
						this.props.usernames.map(username => {
							let img;

							if (username.img === '0') {
								img = './default-image.jpg';
							} else {
								img = username.img
							}

							if (username.requested) {
								return <Results requested={'true'} id={username.id} key={username.username} username={username.username} img={img} />;
							} else {
								return <Results requested={'false'} id={username.id} key={username.username} username={username.username} img={img} />;
							}
						})
					}
				</div>
			</div>
		);
	}
};

class Results extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			requested: false
		};

		this.sendRequest = this.sendRequest.bind(this);
		this.cancelRequest = this.cancelRequest.bind(this);
	}

	componentDidMount() {
		if (this.props.requested === 'true') {
			this.setState({
				requested: true
			});
		} else if (this.props.requested === 'false') {
			this.setState({
				requested: false
			});
		}
	}

	sendRequest(e) {
		fetch(sendRequest, {
			method: 'PUT',
			body: JSON.stringify({
				id: localStorage.getItem('userId'),
				friendId: e.target.id,
				friendUsername: e.target.className
			}),
			headers: {
				'content-type':'application/json'
			}
		});

		this.setState({
			requested: true
		});
	}

	cancelRequest(e) {
		fetch(cancelRequest, {
			method: 'PUT',
			body: JSON.stringify({
				id: localStorage.getItem('userId'),
				friendId: e.target.id
			}),
			headers: {
				'content-type':'application/json'
			}
		});

		this.setState({
			requested:false
		});
	}

	render() {
		return(
			<div className='result'>
				<img src={this.props.img} alt='' />
				<h1>{this.props.username}</h1>
				{ this.state.requested? <button id={this.props.id} className={this.props.username} onClick={this.cancelRequest} >requested</button> : <button id={this.props.id} className={this.props.username} onClick={this.sendRequest} >friend request</button>}
			</div>
		);
	}
};



export default Account;




