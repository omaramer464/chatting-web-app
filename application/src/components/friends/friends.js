import React from 'react';
import './friends.css';
import {ipAdress} from '../../../package.json';

const getfriends = `http://${ipAdress}:5000/account/friends/get`;
const removefriend = `http://${ipAdress}:5000/account/friends/remove`;
const message = `http://${ipAdress}:5000/account/friends/message`;
const getfriendRequests = `http://${ipAdress}:5000/account/friends/friendRequests`;
const deny = `http://${ipAdress}:5000/account/friends/friendRequests/deny`;
const accept = `http://${ipAdress}:5000/account/friends/friendRequests/accept`;



class Friends extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			friends: [],
			exceptions: [],
			nofriends: 'No friends',
			nofriends2:'Go to the search section to find friends to chat with',
			showFriendRequests: 'none',
			friendRequests: [],
			numberOfFriendRequests:'',
			showNoFriendRequests: 'none'
		};

		this.removefriend = this.removefriend.bind(this);
		this.message = this.message.bind(this);
		this.showFriendRequests = this.showFriendRequests.bind(this);

	}

	componentDidMount() {
		fetch(getfriends, {
			method:'POST',
			body: JSON.stringify({
				id: localStorage.getItem('userId'),
				accessToken: localStorage.getItem('userAccessToken')
			}),
			headers: {
				'content-type':'application/json'
			}
		}).then(response => response.json()).then(data => {
			if (data.data.data) {
				this.setState({
					friends: data.data.data,
					exceptions: data.data.removemessage,
					nofriends:'',
					nofriends2:''
				});
			}
		});

		fetch(getfriendRequests, {
			method: 'POST',
			body: JSON.stringify({
				id: localStorage.getItem('userId')
			}),
			headers: {
				'content-type':'application/json'
			}
		}).then(response => response.json()).then(data => {
			if (data.data === 'no requests') {
				this.setState({
					showNoFriendRequests: 'block',
					friendRequests: [],
					numberOfFriendRequests: ''
				});
			} else if (data.data) {
				this.setState({
					showNoFriendRequests: 'none',
					friendRequests: data.data,
					numberOfFriendRequests: data.data.length
				});
			}
		});
	}

	removefriend(e) {
		fetch(removefriend, {
			method: 'PUT',
			body: JSON.stringify({
				id: localStorage.getItem('userId'),
				friendId: e.target.id,
				friendUsername: e.target.username
			}),
			headers: {
				'content-type':'application/json'
			}
		}).then(response => response.json()).then(data => {
			if (data.data === 'no friends') {
				this.setState({
					friends: [],
					exceptions: [],
					nofriends: 'No friends',
					nofriends2:'Go to the search section to find friends to chat with'
				});
			} else if (data.data) {
				this.setState({
					friends: data.data,
					nofriends: '',
					nofriends2:''
				});
			}
		});
	}

	message(e) {
		fetch(message, {
			method: 'POST',
			body: JSON.stringify({
				id: localStorage.getItem('userId'),
				theirId: e.target.id
			}),
			headers: {
				'content-type':'application/json'
			}
		}).then(response => response.json()).then(data => {
			if (data.data) {
				this.setState({
					friends: data.data.data,
					exceptions: data.data.removemessage,
					nofriends:'',
					nofriends2:''
				});

			}
 		});
	}

	showFriendRequests() {
		if (this.state.showFriendRequests === 'block') {
			this.setState({
				showFriendRequests: 'none'
			});
		} else {
			this.setState({
				showFriendRequests: 'block'
			});
		}
	}

	deny(e) {
		fetch(deny, {
			method: 'PUT',
			body: JSON.stringify({
				id: localStorage.getItem('userId'),
				requestId: e.target.id
			}),
			headers: {
				'content-type':'application/json'
			}
		}).then(response => response.json()).then(data => {
			if (data.data === 'no requests') {
				this.setState({
					showNoFriendRequests: 'block',
					friendRequests: [],
					numberOfFriendRequests: ''
				});
			} else if (data.data) {
				this.setState({
					showNoFriendRequests: 'none',
					friendRequests: data.data,
					numberOfFriendRequests: data.data.length
				});
			}
		});
	}

	accept(e) {
		fetch(accept, {
			method: 'PUT',
			body: JSON.stringify({
				id: localStorage.getItem('userId'),
				requestId: e.target.id,
				requestUsername: e.target.className
			}),
			headers: {
				'content-type':'application/json'
			}
		}).then(response => response.json()).then(data => {
			if (data.data.requests === 'no requests') {
				this.setState({
					showNoFriendRequests: 'block',
					friendRequests: [],
					numberOfFriendRequests: '',
					friends: data.data.friends,
					nofriends: '',
					nofriends2:''
				});
			} else if (data.data) {
				this.setState({
					showNoFriendRequests: 'none',
					friendRequests: data.data.requests,
					numberOfFriendRequests: data.data.length,
					friends: data.data.friends,
					nofriends: '',
					nofriends2:''
				});
			}
		});
	}

	render() {
		return (
			<div className='friends-window' >
				<button className='friendRequests' onClick={this.showFriendRequests} >friend requests {this.state.numberOfFriendRequests}</button>
				<div onMouseLeave={this.showFriendRequests} style={{display: this.state.showFriendRequests}} className='scroll-requests' >
					<div className='friendRequests-window' >
						<p style={{display: this.state.showNoFriendRequests, color:'white'}} >No Friend Requests available</p>

						{
							this.state.friendRequests.map(request => {
								return <Request key={request.username} denyRequest={(e) => this.deny(e)} acceptRequest={(e) => this.accept(e)} id={request.id} username={request.username} />
							})
						}
					</div>
				</div>
				<div className='scroll-friends' >
					<div className='friends-menu' >
						<h1 className='errorh1' >{this.state.nofriends}</h1>
						<p>{this.state.nofriends2}</p>
						{
							this.state.friends.map(friend => {
								let img;

								if (friend.img === '0') {
									img='./default-image.jpg';
								} else {
									img=friend.img;
								}

								let removebutton;
								if (this.state.exceptions.includes(friend.id)) {
									removebutton = '';
								} else {
									removebutton = <button className='message' onClick={(e) => this.message(e)} id={friend.id} >message</button>;
								}
								
								return <FriendsItems removefriend={(e) => this.removefriend(e)} key={friend.username} remove={removebutton} username={friend.username} id={friend.id} img={img} />;
							})
						}
					</div>
				</div>
			</div>
		);
	}
};

///

class Request extends React.Component {
	render() {
		return (
			<div className='requestItem' >
				<h1>{this.props.username}</h1>
				<button onClick={this.props.denyRequest} id={this.props.id} className={this.props.username} >X</button>
				<button onClick={this.props.acceptRequest} id={this.props.id} className={this.props.username} >A</button>
			</div>
		);
	}
};

class FriendsItems extends React.Component {
	render() {
		return (
			<div className='friendItems-box' >
				<img src={this.props.img} alt='' />
				<h1>{this.props.username}</h1>
				<button className='removefriend' onClick={(e) => this.props.removefriend(e)} id={this.props.id} >remove friend</button>
				{this.props.remove}
			</div>
		);
	}
};

export default Friends;



