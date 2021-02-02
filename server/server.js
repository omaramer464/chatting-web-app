const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const errorHandler = require('errorhandler');
const socketio = require('socket.io');
const http = require('http');
const bcrypt = require('bcrypt');
const uuid = require('uuid/v4');
const nodemailer = require('nodemailer');

const app = express();
const server = http.createServer(app);

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./database.sqlite');

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json({limit:'50mb'}));
app.use(morgan('dev'));
app.use(errorHandler());

const io = socketio(server, { wsEngine: 'ws' });

io.on('connection', async (socket) => {

	await socket.on('join', async ({chatId, myId}) => {
		await socket.join(chatId);
		await socket.to(chatId).emit('online');
		console.log(io.sockets.adapter.rooms[chatId]);
	});

	socket.on('sendMessage', ({chatId, message ,myId}) => {
		const messageSent = {myId, message};
		db.get(`SELECT messages FROM chat WHERE id = $id`, {
			$id: chatId
		}, (err, row) => {
			if (err) {
				console.log(err);
			} else if (row) {
				const parsedMessages = JSON.parse(row.messages);
				parsedMessages.messages.push(messageSent);
				const stringifiedMessages = JSON.stringify(parsedMessages);
				db.run(`UPDATE chat SET messages = $messages WHERE id = $id`, {
					$messages: stringifiedMessages,
					$id: chatId
				}, (err) => {
					if (err) {
						console.log(err);
					} else {
						io.sockets.in(chatId).emit('messages', ({messages: parsedMessages}));
					}
				});
			}
		});
	});

	socket.on('deletemessage', ({chatId, message}) => {
		db.get(`SELECT messages FROM chat WHERE id = $id`, {
			$id: chatId
		}, (err, row) => {
			if (err) {
				console.log(err);
			} else if (row) {
				const parsedMessages = JSON.parse(row.messages);
				parsedMessages.messages.splice(message, 1);
				const stringifiedMessages = JSON.stringify(parsedMessages);
				db.run(`UPDATE chat SET messages = $messages WHERE id = $id`, {
					$messages: stringifiedMessages,
					$id: chatId
				}, (err) => {
					if (err) {
						console.log(err);
					} else {
						io.sockets.in(chatId).emit('messages', ({messages: parsedMessages}));
					}
				});
			}
		});
	});

	socket.on('typing', ({chatId}) => {
		socket.to(chatId).emit('ontyping');
	});

	socket.on('stoptyping', ({chatId}) => {
		socket.to(chatId).emit('stoptyping');
	});

	socket.on('roomStatus', async ({chatId}) => {
		if (Object.keys(io.sockets.adapter.rooms[chatId].sockets).length === 1) {
			if (Object.keys(io.sockets.adapter.rooms[chatId].sockets)[0] === socket.id) {
				await socket.emit('status', ({status:false}));
			}
		} else {
			await socket.emit('status', ({status:true}));
		}
	});

	socket.on('disconnection', async ({chatId}) => {
		await socket.leave(chatId);
		await socket.disconnect();
		await socket.to(chatId).emit('offline');
	});

	socket.on('disconnect', () => {
		socket.removeAllListeners();
		console.log('disconnected');
	})
});

app.post('/check/username', (req, res, next) => {
	const requestBody = req.body;
	db.get(`SELECT username FROM account WHERE username = $username`, {
		$username: requestBody.username
	}, (err, row) => {
		if (err) {
			next(err);
		} else if (row) {
			res.status(409).json({data:'exists'});
		} else {
			res.status(200).json({data:requestBody.username});
		}
	});
});	

app.post('/check/email', (req, res, next) => {
	const requestBody = req.body;
	db.get(`SELECT email FROM account WHERE email = $email`, {
		$email: requestBody.email
	}, (err, row) => {
		if (err) {
			next(err);
		} else if (row) {
			res.status(409).json({data:'exists'});
		} else {
			res.status(200).json({data:requestBody.email});
		}
	});
});	

app.post('/signup', async (req, res, next) => {
	const requestBody = req.body;
	const id = await uuid();
	const password = await bcrypt.hash(requestBody.password, 10);
	const friends = JSON.stringify({friends: []});
	const friendRequests = JSON.stringify({requests: []});
	const sentRequests = JSON.stringify({requests: []});
	db.run(`INSERT INTO account (id, accessToken ,username, password, email, firstName, lastName, friends, friendRequests, sentRequests)
		VALUES ($id, $accessToken, $username, $password, $email, $firstName, $lastName, $friends, $friendRequests, $sentRequests)`, {
			$id: id,
			$accessToken:id,
			$username:requestBody.username,
			$password: password,
			$email: requestBody.email,
			$firstName: requestBody.firstName,
			$lastName: requestBody.lastName,
			$friends: friends,
			$friendRequests: friendRequests,
			$sentRequests: sentRequests
		}, (err, row) => {
			if (err) {
				next(err);
			} else {
				db.run(`INSERT INTO picture (id, img) VALUES ($id, 0)`, {
					$id: id
				}, (err, row) => {
					if (err) {
						next(err);
					} else {

						res.sendStatus(200); // delete this server response when the email fuctionality is enabled

						// ---------------

						/* 

						Remember to use a google account with the 'less secure app access'
						setting enabled from the account settings -> security.

						Don't put a personal account. This requires an account with 'less secure app access'
						setting enabled which is unsafe and not recommended unless it is a testing or for 
						this email unctionality only.

						This email functionality is commented out for testing reasons. 
	
						When the email functionality is being used delete the server response above. 

						*/

						// ---------------



						// const yourEmail = ''; // your email with the 'less secure app access' setting enabled
						// const yourPassword = ''; // your email's password


						// let transporter = nodemailer.createTransport({
						// 	service: 'gmail',
						// 	  auth: {
						// 	    user: yourEmail,
						// 	    pass: yourPassword
						// 	  }
						// });

						// let mailObject = {
						// 	from: yourEmail,
						// 	to: requestBody.email,
						// 	subject: "",
						// 	text: ""
						// };

						// transporter.sendMail(mailObject, function(error, info) {
						// 	if (error) {
						// 		res.sendStatus(409);
						// 	} else {
						// 		res.sendStatus(200);
						// 	}
						// });

					}
				});
			}
		});
});

app.post('/login', (req, res, next) => {
	const requestBody = req.body;
	db.get(`SELECT * FROM account WHERE username = $username`, {
		$username: requestBody.username.toString()
	}, async (err, row) => {
		if (err) {
			next(err);
		} else if (row) {
			if (await bcrypt.compare(requestBody.password, row.password)) {
				const accessToken = await bcrypt.hash(row.accessToken, 10);
				res.status(200).json({data:{username: row.username, id: row.id, accessToken: accessToken}});
			} else {
				res.status(404).json({data:'notfound'});
			}
	
		} else {
			res.status(404).json({data:'notfound'});
		}
	});
});

async function validation(req, res, next) {
	if (await bcrypt.compare(req.body.id, req.body.accessToken)) {
		next();
	} else {
		res.sendStatus(409);
	}
};

app.post('/account/get/refresh', validation, async (req, res, next) => {
	const requestBody = req.body;
	db.get(`SELECT username FROM account WHERE id = $id AND username=$username`, {
		$id: requestBody.id,
		$username: requestBody.username
	}, (err, row) => {
		if (err) {
			next(err);
		} else if (row) {
			res.sendStatus(200);
		} else {
			res.sendStatus(409);
		}
	});
});

app.delete('/account/delete', (req, res, next) => {
	const requestBody = req.body;
	db.run(`DELETE FROM account WHERE id = $id`, {
		$id: requestBody.id
	}, (err, row) => {
		if (err) {
			next(err);
		} else {
			db.run(`DELETE FROM chat WHERE first = $id UNION DELETE FROM chat WHERE second = $id`, {
				$id: requestBody.id
			}, (err) => {
				if (err) {
					next(err);
				} else {
					db.run(`DELETE FROM picture WHERE id=$id`, {
						$id:requestBody.id
					}, (err) => {
						if (err) {
							next(err);
						} else {
							res.status(204).send();
						}
					});
				}
			});
		}
	});
});

app.post('/account/profileimg', (req, res, next) => {
	const requestBody = req.body;
	db.get(`SELECT * FROM picture WHERE id = $id`, {
		$id: requestBody.id
	}, (err, row) => {
		if (err) {
			next(err);
		} else if (row) {
			res.status(200).json({data:row.img});
		} else {
			res.sendStatus(200);
		}
	});
});

app.put('/account/profileimg/change', (req, res, next) => {
	const requestBody = req.body;
	db.run(`UPDATE picture SET img = $img WHERE id = $id`, {
		$img: requestBody.img,
		$id: requestBody.id
	}, (err, row) => {
		if (err) {
			next(err);
		} else {
			res.status(200).json({data:requestBody.img.toString()});
		}
	});
});

app.put('/account/profileimg/remove', (req, res, next) => {
	const requestBody = req.body;
	db.get(`SELECT * FROM picture WHERE id = $id`, {
		$id: requestBody.id
	}, (err, row) => {
		if (err) {
			next(err);
		} else if (row) {
			db.run(`UPDATE picture SET img = 0 WHERE id = $id`, {
				$id: requestBody.id
			}, (err, row) => {
				if (err) {
					next(err);
				} else {
					res.status(200).json({data:'removed'});
				}
			});
		}
	});
});

app.put('/account/change/username', (req, res, next) => {
	const requestBody = req.body;
	if (requestBody.username !== '') {
		db.get(`SELECT username FROM account WHERE username = $username`, {
			$username: requestBody.username
		}, (err, row) => {
			if (err) {
				next(err);
			} else if (row) {
				res.status(409).json({data:'exists'});
			} else {
				db.run(`UPDATE account SET username = $username WHERE id = $id`, {
					$username: requestBody.username,
					$id: requestBody.id
				}, (err, row) => {
					if (err) {
						next(err);
					} else {
						res.status(200).json({data:'allgood'});
					}
				});
			}
		});
	} else {
		res.status(409).json({data:'invalid'});
	}
});

app.put('/account/change/password', (req, res, next) => {
	const requestBody = req.body;
	if (requestBody.oldpassword === requestBody.newpassword || requestBody.oldpassword === '' || requestBody.newpassword === '') {
		res.status(409).json({data:'invalid'});
	} else if (requestBody.newpassword.length < 7) {
		res.status(409).json({data:'weak'});
	} else {
		db.get(`SELECT password FROM account WHERE id = $id`, {
			$id: requestBody.id
		}, async (err, row) => {
			if (err) {
				next(err);
			} else {
				if (await bcrypt.compare(requestBody.oldpassword, row.password)) {
					const password = await bcrypt.hash(requestBody.newpassword, 10);
					db.run(`UPDATE account SET password = $password WHERE id = $id`, {
						$password: password,
						$id: requestBody.id
					}, (err, row) => {
						if (err) {
							next(err);
						} else {
							res.status(200).json({data:'allgood'});
						}
					});
				} else {
					res.status(409).json({data:'incorrect'});
				}
			}
		});
	}
});

app.post('/account/search', (req, res, next) => {
	const requestBody = req.body;
	if (requestBody.username !== '') {
		db.all(`SELECT id, username FROM account WHERE username LIKE '${requestBody.username}%' EXCEPT SELECT id, username FROM account WHERE id = $id`, {
			$id: requestBody.id
		}, (err, row) => {
			if (err) {
				next(err);
			} else if (row) {
				const  row1 = row;

				db.get(`SELECT friends FROM account WHERE id = $id`, {
					$id : requestBody.id
				}, (err, row) => {
					if (err) {
						next(err);
					} else if (row) {
						const parsedFriends = JSON.parse(row.friends);

						
							for (let j=0; j< parsedFriends.friends.length; j++) {
								for (let i=0; i < row1.length; i++) {
									if (row1[i].id === parsedFriends.friends[j].id) {
										row1.splice(i, 1);
									}
								}
							}
						
						

						db.get(`SELECT sentRequests FROM account WHERE id=$id`, {
							$id: requestBody.id
						}, (err, row) => {

							let requested = [];

							if (err) {
								next(err);
							} else if (row) {
								const parsedRequests = JSON.parse(row.sentRequests);
								for (let i=0; i<parsedRequests.requests.length; i++) {
									requested.push(parsedRequests.requests[i].id);
								}
							}
							db.get(`SELECT friendRequests FROM account WHERE id = $id`, {
								$id: requestBody.id
							}, (err, row ) => {

								const requests = [];

								if (err) {
									next(err);
								} else {
									const parsed = JSON.parse(row.friendRequests);
									if (parsed.requests.length !== 0) {
										for (let i=0; i < parsed.requests.length; i++) {
											requests.push(parsed.requests[i]); 
										}
									}

								}

								const results = [];
								for (let i=0; i<row1.length; i++) {
									if (requested.length !== 0) {
										for (let s=0; s<requested.length; s++) {
											if (row1[i].id === requested[s]) {
												results.push({id: row1[i].id, username: row1[i].username, requested: true});
											} else {
												results.push({id: row1[i].id, username: row1[i].username, requested: false});
											}
										}
									} else {
										results.push({id: row1[i].id, username: row1[i].username, requested: false});
									}
								}

								for (let i=0; i < requests.length; i++) {
									for (let j=0; j < results.length; j++) {
										if (requests[i].id === results[j].id) {
											results.splice(j, 1);
										}
									}
								}

								let idForImg = [];

								for (let i=0; i< results.length; i++) {
									idForImg.push(results[i].id);
								}

								let test2;

								if (idForImg.length >= 2) {
									const test1 = idForImg.join("', '");
									test2 = "('" + test1 + "')";
								} else {
									test2 = "('" + idForImg.join('') + "')";
								}


								db.all(`SELECT * FROM picture WHERE id IN ${test2}`, (err, row) => {
									if (err) {
										next(err);
									} else if (row) {
										let finalResult = [];
										for (let i=0; i<results.length; i++) {
											for (let j=0; j<row.length; j++) {
												if (results[i].id === row[j].id) {
													finalResult.push({id:results[i].id, username: results[i].username, requested: results[i].requested, img: row[j].img});
												} 
											}
										}

										res.status(200).json({data: finalResult});
									}
								});
							});

						});
					}
				});
			} else {
				res.status(404).json({data:'notfound'});
			}
		});
	}
});

app.post('/chat/get', (req, res, next) => {
	const requestBody = req.body;
	const first = requestBody.chatId.split('&')[0];
	const second = requestBody.chatId.split('&')[1];

	let theirId;

	if (first === requestBody.myId) {
		theirId = second;
	} else if (second === requestBody.myId) {
		theirId = first;
	}

	db.get(`SELECT messages FROM chat WHERE id = $id AND first = $first AND second = $second`, {
		$id: requestBody.chatId,
		$first: first,
		$second: second
	}, (err, row) => {
		if (err) {
			next(err);
		} else if (row) {
			const messages = row.messages;
			db.get(`SELECT username FROM account WHERE id = $theirId`, {
				$theirId: theirId
			}, (err, row) => {
				if (err) {
					next(err);
				} else if (row) {
					const parsedMessages = JSON.parse(messages);
					res.status(200).json({data:{messages:parsedMessages, username:row.username}});
				} else {
					res.status(404).json({data:'notfound'});
				}
			});
		} else {
			res.status(404).json({data:'notfound'});
		}
	});
});

app.post('/account/chats', async (req, res, next) => {
	const requestBody = req.body;
	if (await bcrypt.compare(requestBody.id, requestBody.accessToken)) {
		db.get(`SELECT username FROM account WHERE id=$id`, {
			$id: requestBody.id
		}, (err, row) => {
			if (err) {
				next(err);
			} else if (row) {
				db.all(`SELECT id, second, messages FROM chat WHERE first = $id UNION SELECT id, first, messages FROM chat WHERE second = $id`, {
					$id: requestBody.id
				}, (err, row) => {
					if (err) {
						next(err);
					} else if (row.length !== 0) {
						const chatIds = [];
						const ids = [];
						for (let i=0; i<row.length; i++) {
							if (row[i].second !== requestBody.id) {
								const parsedMessages = JSON.parse(row[i].messages);
								if (parsedMessages.messages.length === 0) {
									chatIds.push({chatId: row[i].id, id: row[i].second, sentby: '',lasttext: ''});
								} else {
									if (parsedMessages.messages[parsedMessages.messages.length-1].myId === requestBody.id) {
										chatIds.push({chatId: row[i].id, id: row[i].second, sentby: 'me',lasttext: parsedMessages.messages[parsedMessages.messages.length-1].message});
									} else {
										chatIds.push({chatId: row[i].id, id: row[i].second, sentby: 'them',lasttext: parsedMessages.messages[parsedMessages.messages.length-1].message});
									}
								}
								ids.push(row[i].second);
							} else {
								if (parsedMessages.messages.length === 0) {
									chatIds.push({chatId: row[i].id, id: row[i].first, sentby: '',lasttext: ''});
								} else {
									if (parsedMessages.messages[parsedMessages.messages.length-1].myId === requestBody.id) {
										chatIds.push({chatId: row[i].id, id: row[i].first, sentby: 'me',lasttext: parsedMessages.messages[parsedMessages.messages.length-1].message});
									} else {
										chatIds.push({chatId: row[i].id, id: row[i].first, sentby: 'them',lasttext: parsedMessages.messages[parsedMessages.messages.length-1].message});
									}
								}
								ids.push(row[i].first);
							}
						}

						let test2;
						if (ids.length >= 2) {
							const test1 = ids.join("', '");
							test2 = "('" + test1 + "')";
						} else {
							test2 = "('" + ids.join('') + "')";
						}

						db.all(`SELECT id, username FROM account WHERE id IN ${test2}`, (err, row) => {
							if (err) {
								next(err);
							} else if (row) {
								const usernames = [];
								for (let j=0; j<row.length; j++) {
									usernames.push({id: row[j].id, username: row[j].username});
								}

								const chatObj = [];

								for (let i=0; i < chatIds.length; i++) {
									for (let j=0; j< usernames.length; j++) {
										if (chatIds[i].id === usernames[j].id) {
											chatObj.push({chatId:chatIds[i].chatId, username:usernames[j].username, id: usernames[j].id, sentby: chatIds[i].sentby, lasttext: chatIds[i].lasttext});
										}
									}
								}

								db.all(`SELECT * FROM picture WHERE id IN ${test2}`, (err, row) => {

									let finalChatObj = [];

									if (err) {
										next(err);
									} else {
										for (let i=0; i < chatObj.length; i++) {
											for (let j=0; j < row.length; j++) {
												if (chatObj[i].id === row[j].id) {
													finalChatObj.push({chatId: chatObj[i].chatId, username: chatObj[i].username, img: row[j].img, sentby: chatObj[i].sentby, lasttext: chatObj[i].lasttext});
												}
											}
										}
									}

									res.status(200).json({data:finalChatObj});
								});
							}
						});
					}
				});
			} else {
				res.status(409).send();
			}
		});
	} else {
		res.status(409).send();
	}
});

app.post('/account/friends/get', async (req, res, next) => {
	const requestBody = req.body;
	if (await bcrypt.compare(requestBody.id, requestBody.accessToken)) {
		db.get(`SELECT friends FROM account WHERE id=$id`, {
			$id: requestBody.id
		}, (err, row) => {
			if (err) {
				next(err);
			} else if (row) {
				const parsedFriends = JSON.parse(row.friends);
				if (parsedFriends.friends.length !== 0) {
					const friends = [];
					for (let i=0; i < parsedFriends.friends.length; i++) {
						friends.push(parsedFriends.friends[i].id);
					}

					let test2;

					if (friends.length >= 2) {
						const test1 = friends.join("', '");
						test2 = "('" + test1 + "')";
					} else {
						test2 = "('" + friends.join('') + "')";
					}

					db.all(`SELECT id, img FROM picture WHERE id IN ${test2}`, (err, row) => {
						if (err) {
							next(err);
						} else {
							let finalResult = [];
							for (let i=0; i<parsedFriends.friends.length; i++) {
								for (let j=0; j<row.length; j++) {
									if (parsedFriends.friends[i].id === row[j].id) {
										finalResult.push({id:parsedFriends.friends[i].id, username: parsedFriends.friends[i].username, img: row[j].img});
									} 
								}
							}

							db.all(`SELECT second FROM chat WHERE first = $id AND second IN ${test2} UNION SELECT first FROM chat WHERE second = $id AND first IN ${test2}`, {
								$id: requestBody.id
							}, (err, row) => {
								if (err) {
									next(err);
								} else if (row) {
									const exceptions = [];
									for (let i=0; i < Object.values(row).length; i++) {
										exceptions.push(Object.values(row[i]).toString());
									}
									res.status(200).json({data: {data:finalResult, removemessage: exceptions}});
								}
							});
						}
					});
				}
			}
		});
	}
});

app.put('/account/friends/sendRequest', (req, res, next) => {
	const requestBody = req.body;
	db.get(`SELECT username FROM account WHERE id=$id`, {
		$id: requestBody.id
	}, (err, row) => {
		if (err) {
			next(err);
		} else if (row) {
			const sent = {id:requestBody.friendId, username: requestBody.friendUsername};
			const sentTo = {id:requestBody.id, username: row.username};
			db.get(`SELECT friendRequests FROM account WHERE id=$id`, {
				$id: requestBody.friendId
			}, (err, row) => {
				if (err) {
					next(err);
				} else if (row) {
					const parsedRequests = JSON.parse(row.friendRequests);
					parsedRequests.requests.push(sentTo);
					const stringifiedRequests = JSON.stringify(parsedRequests);
					db.run(`UPDATE account SET friendRequests = $friendRequests WHERE id=$id`, {
						$friendRequests: stringifiedRequests,
						$id: requestBody.friendId
					}, (err) => {
						if (err) {
							next(err);
						} else {
							db.get(`SELECT sentRequests FROM account WHERE id=$id`, {
								$id: requestBody.id
							}, (err, row) => {
								if (err) {
									next(err);
								} else if (row) {
									const parsedSent = JSON.parse(row.sentRequests);
									parsedSent.requests.push(sent);
									const stringifiedSent = JSON.stringify(parsedSent);
									db.run(`UPDATE account SET sentRequests = $sentRequests WHERE id=$id`, {
										$sentRequests: stringifiedSent,
										$id: requestBody.id
									}, (err) => {
										if (err) {
											next(err);
										}
									});
								}
							});
						}
					});
				}
			});
		}
	});
	
});

app.put('/account/friends/cancelRequest', (req, res, next) => {
	const requestBody = req.body;
	db.get(`SELECT sentRequests FROM account WHERE id=$id`, {
		$id: requestBody.id
	}, (err, row) => {
		if (err) {
			next(err);
		} else if (row) {
			const parsedSent = JSON.parse(row.sentRequests);
			for (let i=0; i<parsedSent.requests.length; i++) {
				if (parsedSent.requests[i].id === requestBody.friendId) {
					parsedSent.requests.splice(i, 1);
				}
			}
			const stringifiedSent = JSON.stringify(parsedSent);
			db.run(`UPDATE account SET sentRequests = $sentRequests WHERE id=$id`, {
				$sentRequests: stringifiedSent,
				$id: requestBody.id
			}, (err) => {
				if (err) {
					next(err);
				} else {
					db.get(`SELECT friendRequests FROM account WHERE id=$id`, {
						$id: requestBody.friendId
					}, (err, row) => {
						if (err) {
							next(err);
						} else if (row) {
							const parsedRequests = JSON.parse(row.friendRequests);
							for (let i=0; i<parsedRequests.requests.length; i++) {
								if (parsedRequests.requests[i].id === requestBody.id) {
									parsedRequests.requests.splice(i, 1);
								}
							}
							const stringifiedRequests = JSON.stringify(parsedRequests);
							db.run(`UPDATE account SET friendRequests = $friendRequests WHERE id=$id`, {
								$friendRequests: stringifiedRequests,
								$id: requestBody.friendId
							}, (err) => {
								if (err) {
									next(err);
								}
							});
						}
					});
				}
			});
		}
	});
});

app.put('/account/friends/remove', (req, res, next) => {
	const requestBody = req.body;
	db.get(`SELECT friends FROM account WHERE id=$id`, {
		$id: requestBody.id
	}, (err, row) => {
		if (err) {
			next(err);
		} else if (row) {
			const parsedFriends = JSON.parse(row.friends);
			for (let i=0; i < parsedFriends.friends.length; i++) {
				if (parsedFriends.friends[i].id === requestBody.friendId) {
					parsedFriends.friends.splice(i, 1);
				}
			}
			const stringifiedFriends = JSON.stringify(parsedFriends);
			db.run(`UPDATE account SET friends = $friends WHERE id=$id`, {
				$friends: stringifiedFriends,
				$id: requestBody.id
			}, (err) => {
				if (err) {
					next(err);
				} else {
					db.get(`SELECT friends FROM account WHERE id=$id`, {
						$id: requestBody.friendId
					}, (err, row) => {
						if (err) {
							next(err);
						} else if (row) {
							const parsedFriends2 = JSON.parse(row.friends);
							for (let i=0; i < parsedFriends2.friends.length; i++) {
								if (parsedFriends2.friends[i].id === requestBody.id) {
									parsedFriends2.friends.splice(i, 1);
								}
							}

							const stringifiedFriends2 = JSON.stringify(parsedFriends2);

							db.run(`UPDATE account SET friends = $friends WHERE id = $id`, {
								$friends: stringifiedFriends2,
								$id: requestBody.friendId
							}, (err) => {
								if (err) {
									next(err);
								} else {
									db.get(`SELECT id FROM chat WHERE first= $first AND second = $second UNION SELECT id FROM chat WHERE first = $second AND second=$first`, {
										$first: requestBody.id,
										$second: requestBody.friendId
									}, (err, row) => {
										if (err) {
											next(err);
										} else if (row) {
											db.run(`DELETE FROM chat WHERE id=$id`, {
												$id: row.id
											}, (err) => {
												if (err) {
													next(err);
												}
											});
										}
									});

									if (parsedFriends.friends.length !== 0) {
										res.status(200).json({data:parsedFriends.friends});
									} else {
										res.status(200).json({data:'no friends'});
									}
								}
							});
						}
					});
				}
			});
		}
	});
});

app.post('/account/friends/message', (req, res, next) => {
	const requestBody = req.body;
	const id = requestBody.id + '&' + requestBody.theirId;
	const messages = JSON.stringify({messages:[]});
	db.run(`INSERT INTO chat (id, first, second, messages) VALUES ($id, $first, $second, $messages)`, {
		$id: id,
		$first: requestBody.id,
		$second: requestBody.theirId,
		$messages: messages
	}, (err) => {
		if (err) {
			next(err);
		} else {
			db.get(`SELECT friends FROM account WHERE id=$id`, {
				$id: requestBody.id
			}, (err, row) => {
				if (err) {
					next(err);
				} else if (row) {
					const parsedFriends = JSON.parse(row.friends);
					if (parsedFriends.friends.length !== 0) {
						const friends = [];
						for (let i=0; i < parsedFriends.friends.length; i++) {
							friends.push(parsedFriends.friends[i].id);
						}

						let test2;

						if (friends.length >= 2) {
							const test1 = friends.join("', '");
							test2 = "('" + test1 + "')";
						} else {
							test2 = "('" + friends.join('') + "')";
						}

						db.all(`SELECT second FROM chat WHERE first = $id AND second IN ${test2} UNION SELECT first FROM chat WHERE second = $id AND first IN ${test2}`, {
							$id: requestBody.id
						}, (err, row) => {
							if (err) {
								next(err);
							} else if (row) {
								const exceptions = [];
								for (let i=0; i < Object.values(row).length; i++) {
									exceptions.push(Object.values(row[i]).toString());
								}

								res.status(200).json({data: {data:parsedFriends.friends, removemessage: exceptions}});
							}
						});
					}
				}
			});
		}
	});
});

app.post('/account/friends/friendRequests', (req, res, next) => {
	const id = req.body.id
	db.get(`SELECT friendRequests FROM account WHERE id=$id`, {
		$id: id
	}, (err, row) => {
		if (err) {
			next(err);
		} else if (row) {
			const parsedRequests = JSON.parse(row.friendRequests);
			if (parsedRequests.requests.length !== 0) {
				res.status(200).json({data: parsedRequests.requests});
			} else {
				res.status(200).json({data: 'no requests'});
			}
		}
	});
});

app.put('/account/friends/friendRequests/deny', (req, res, next) => {
	const requestBody = req.body;
	db.get(`SELECT friendRequests FROM account WHERE id=$id`, {
		$id: requestBody.id
	}, (err, row) => {
		if (err) {
			next(err);
		} else if (row) {
			const parsedRequests = JSON.parse(row.friendRequests);
			for (let i=0; i < parsedRequests.requests.length; i++) {
				if (parsedRequests.requests[i].id === requestBody.requestId) {
					parsedRequests.requests.splice(i, 1);
				}
			}

			const stringifiedRequests = JSON.stringify(parsedRequests);
			db.run(`UPDATE account SET friendRequests = $friendRequests WHERE id=$id`, {
				$friendRequests: stringifiedRequests,
				$id: requestBody.id
			}, (err) => {
				if (err) {
					next(err);
				} else {
					db.get(`SELECT sentRequests FROM account WHERE id=$id`, {
						$id: requestBody.requestId
					}, (err, row) => {
						if (err) {
							next(err);
						} else if (row) {
							const parsedRequests2 = JSON.parse(row.sentRequests);
							for (let i=0; i < parsedRequests2.requests.length; i++) {
								if (parsedRequests2.requests[i].id === requestBody.id) {
									parsedRequests2.requests.splice(i, 1);
								}
							}

							const stringifiedRequests2 = JSON.stringify(parsedRequests2);
							db.run(`UPDATE account SET sentRequests = $sentRequests WHERE id=$id`, {
								$sentRequests: stringifiedRequests2,
								$id: requestBody.requestId
							}, (err) => {
								if (err) {
									next(err);
								} else {
									db.get(`SELECT friendRequests FROM account WHERE id=$id`, {
										$id: requestBody.id
									}, (err, row) => {
										if (err) {
											next(err);
										} else if (row) {
											const parsedRequests = JSON.parse(row.friendRequests);
											if (parsedRequests.requests.length !== 0) {
												res.status(200).json({data: parsedRequests.requests});
											} else {
												res.status(200).json({data: 'no requests'});
											}
										}
									});
								}
							});
						}
					});
				}
			});
		}
	});
});

app.put('/account/friends/friendRequests/accept', (req, res, next) => {
	const requestBody = req.body;
	db.get(`SELECT friendRequests FROM account WHERE id=$id`, {
		$id: requestBody.id
	}, (err, row) => {
		if (err) {
			next(err);
		} else if (row) {
			const parsedRequests = JSON.parse(row.friendRequests);
			for (let i=0; i < parsedRequests.requests.length; i++) {
				if (parsedRequests.requests[i].id === requestBody.requestId) {
					parsedRequests.requests.splice(i, 1);
				}
			}

			const stringifiedRequests = JSON.stringify(parsedRequests);
			db.run(`UPDATE account SET friendRequests = $friendRequests WHERE id=$id`, {
				$friendRequests: stringifiedRequests,
				$id: requestBody.id
			}, (err) => {
				if (err) {
					next(err);
				} else {
					db.get(`SELECT sentRequests FROM account WHERE id=$id`, {
						$id: requestBody.requestId
					}, (err, row) => {
						if (err) {
							next(err);
						} else if (row) {
							const parsedRequests2 = JSON.parse(row.sentRequests);
							for (let i=0; i < parsedRequests2.requests.length; i++) {
								if (parsedRequests2.requests[i].id === requestBody.id) {
									parsedRequests2.requests.splice(i, 1);
								}
							}

							const stringifiedRequests2 = JSON.stringify(parsedRequests2);
							db.run(`UPDATE account SET sentRequests = $sentRequests WHERE id=$id`, {
								$sentRequests: stringifiedRequests2,
								$id: requestBody.requestId
							}, (err) => {
								if (err) {
									next(err);
								} else {
									db.get(`SELECT username FROM account WHERE id = $id`, {
										$id: requestBody.id
									}, (err, row) => {
										if (err) {
											next(err);
										} else if (row) {
											const myUsername = row.username;
											const myFriend = {id: requestBody.requestId, username: requestBody.requestUsername};
											const theirFriend = {id: requestBody.id, username: myUsername};

											db.get(`SELECT friends FROM account WHERE id = $id`, {
												$id: requestBody.requestId
											}, (err, row) => {
												if (err) {
													next(err);
												} else if (row) {
													const parsedFriends = JSON.parse(row.friends);
													parsedFriends.friends.push(theirFriend);
													const stringifiedFriends = JSON.stringify(parsedFriends);
													db.run(`UPDATE account SET friends = $friends WHERE id = $id`, {
														$friends: stringifiedFriends,
														$id: requestBody.requestId
													}, (err) => {
														if (err) {
															next(err);
														} else {
															db.get(`SELECT friends FROM account WHERE id = $id`, {
																$id: requestBody.id
															}, (err, row) => {
																if (err) {
																	next(err);
																} else if (row) {
																	const parsedFriends2 = JSON.parse(row.friends);
																	parsedFriends2.friends.push(myFriend);
																	const stringifiedFriends2 = JSON.stringify(parsedFriends2);
																	db.run(`UPDATE account SET friends = $friends WHERE id = $id`, {
																		$friends: stringifiedFriends2,
																		$id: requestBody.id
																	}, (err) => {
																		if (err) {
																			next(err);
																		}
																		db.get(`SELECT friendRequests FROM account WHERE id=$id`, {
																			$id: requestBody.id
																		}, (err, row) => {
																			if (err) {
																				next(err);
																			} else if (row) {
																				const parsedRequests = JSON.parse(row.friendRequests);
																				if (parsedRequests.requests.length !== 0) {
																					res.status(200).json({data: {requests :parsedRequests.requests, friends: parsedFriends2.friends}});
																				} else {
																					res.status(200).json({data: {requests : 'no requests', friends: parsedFriends2.friends}});
																				}
																			}
																		});

																	});
																}
															});
														}
													});
												}
											});

										}
									});
								}
							});
						}
					});
				}
			});
		}
	});
});


server.listen(PORT, () => {
	console.log(`server is up and running at http://localhost:5000`);
});

