import React from 'react';
import io from 'socket.io-client';
import './chat.css';
import {ipAddress} from '../../../package.json';

const getchat = `http://${ipAddress}:5000/chat/get`;


const endpoint = `${ipAddress}:5000`;
let socket;


class Chat extends React.Component {

	constructor(props) {
		super(props);

		this.state = {
			username:'',
			messages:[],
			isTyping: false,
			isTimeout: undefined,
			chatId: this.props.chatId
		};

		this.sendMessage = this.sendMessage.bind(this);
		this.typing = this.typing.bind(this);
		this.deleteMessage = this.deleteMessage.bind(this);

		socket = io(endpoint, {transports: ['websocket'], upgrade: false});

		socket.on('connect', async () => {
			await socket.emit('join', ({chatId:this.state.chatId, myId:localStorage.getItem('userId')}));

			socket.emit('roomStatus', ({chatId:this.state.chatId}));

			socket.on('status', ({status}) => {
				if (status) {
					const dot = document.querySelector('.status');
					dot.style.backgroundColor = '#00ffbc';
				} else {
					const dot = document.querySelector('.status');
					dot.style.backgroundColor = 'red';
				}
			});
		});

		socket.on('messages', ({messages}) => {
			this.setState({
				messages:messages.messages
			});
		});

		socket.on('ontyping', () => {
			const typing = document.querySelector('.typing');
			typing.style.display = 'block';
		});

		socket.on('online', () => {
			const status = document.querySelector('.status');
			status.style.backgroundColor = '#00ffbc';
		});

		socket.on('offline', () => {
			const status = document.querySelector('.status');
			status.style.backgroundColor = 'red';
		});

		socket.on('stoptyping', () => {
			const typing = document.querySelector('.typing');
			typing.style.display = 'none';
		});

	}

	componentDidMount() {
		if (localStorage.getItem('userId') && localStorage.getItem('userAccessToken')) {
			if (this.state.chatId) {

				fetch(getchat, {
					method: 'POST',
					body: JSON.stringify({
						chatId: this.state.chatId,
						myId: localStorage.getItem('userId')
					}),
					headers: {
						'content-type':'application/json'
					}
				}).then(response => response.json()).then(data => {
					if (data.data !== 'notfound' && data.data) {
						this.setState({
							messages : data.data.messages.messages,
							username: data.data.username
						});
					}
				});

			} else {
				window.location.href = `http://${ipAddress}:3000/account`;
			}
		} else {
			window.location.href = `http://${ipAddress}:3000`;
		}
	}

	async componentWillUnmount() {
		await this.setState({
			username: '',
			chatId:'',
			messages:[]
		});
		await socket.emit('disconnection', ({chatId: this.state.chatId}));
	}

	closeMessageSettings() {
		const settings = document.querySelector('.messageSettings');
		settings.style.display = 'none';
	}


	sendMessage() {
		const message = document.querySelector('.messages-window textarea');
		if (message.value.toString() !== '') {

			socket.emit('sendMessage', ({chatId: this.state.chatId, message: message.value.toString(), myId: localStorage.getItem('userId')}));

			message.value = '';
			message.focus();

		} else {
			message.style.border = '2px solid red';
		}
	}

	focus() {
		const message = document.querySelector('.messages-window textarea');
		message.style.border = '2px solid #00ffbc';
	}

	timeoutFunction = () => {
		this.setState({
			isTyping : false
		});

		socket.emit('stoptyping', ({chatId:this.state.chatId}));
	}

	typing() {

		if(this.state.isTyping === false) {
		    this.setState({
				isTyping : true
			});

		    socket.emit('typing', ({chatId:this.state.chatId}));
		    this.setState({
		    	isTimeout: setTimeout(this.timeoutFunction, 500)
		    });
		} else {
		    clearTimeout(this.state.isTimeout);
		    this.setState({
		    	isTimeout: setTimeout(this.timeoutFunction, 500)
		    });
		}
	}

	deleteMessage(e) {
		socket.emit('deletemessage', ({chatId: this.state.chatId, message: e.target.id}));

		const settings = document.querySelector('.messageSettings');
		settings.style.display = 'none';
	}
 
	render() {
		return (
			<div className='chat-window'>
				<button className='close-chat' onClick={this.props.closeChat} >back</button>
				<div className='user'>
					<div className='status' ></div>
					<img className='img' src={this.props.img} alt='' />
					<h1 className='name'>{this.state.username}</h1>
				</div>
				<h1 className='typing' >typing</h1>
				<div onMouseLeave={this.closeMessageSettings} className='messageSettings' >
					<button onClick={this.deleteMessage} className='deleteMessage' >Delete massage</button>
				</div>
				<div className='messages-window'>
					<div className='messages-box'>
						<div className='scroll-messages-box' >
							{
								this.state.messages.map((message, i) => {
									let float;
									let color;
									if (message.myId === localStorage.getItem('userId')) {
										color = 'blue';
										float = 'right';
									} else {
										color = 'grey';
										float = 'left';
									}
									return <Message float={float} color={color} message={message.message} key={i} id={i} />;
								})
							}
						</div>
					</div>
					<textarea placeholder='Message...' onKeyDown={this.typing} onFocus={this.focus} type='text' ></textarea>
					<button onClick={this.sendMessage} className='send-button' >Send</button>
				</div>
			</div>
		);
	}
};


class Message extends React.Component {
	messageSettings(e) {
		const settings = document.querySelector('.messageSettings');
		const deleteButton = document.querySelector('.deleteMessage');
		if (e.target.style.float === 'right') {
			settings.style.display = 'block';
			deleteButton.setAttribute('id', e.target.id);
		}
	}

	render() {
		return (
			<div className='message-small-box' >
				<p onClick={this.messageSettings} id={this.props.id} style={{backgroundColor:this.props.color, float:this.props.float}} className='message-text'>{this.props.message}</p>
			</div>
		);
	}
};	



export default Chat;

