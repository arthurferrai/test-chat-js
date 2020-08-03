const fs = require('fs')
const path = require('path')
const http = require('http')
const https = require('https')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage, generateTypingMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const privateKey = fs.readFileSync('/etc/letsencrypt/live/arthurferrailivechat.tk/privkey.pem', 'utf-8')
const cert = fs.readFileSync('/etc/letsencrypt/live/arthurferrailivechat.tk/fullchain.pem', 'utf-8')
const credentials = {key: privateKey, cert: cert}
const app = express()

const server = http.createServer(app)
const httpsServer = https.createServer(credentials, app)

const io = socketio(httpsServer)

const port = process.env.PORT || 80
const sslPort = process.env.SSL_PORT || 443
const publicDirectoryPath = '/home/ubuntu/test-chat-js/public'

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {
    console.log('New WebSocket connection')

    socket.on('join', (options, callback) => {
        const { error, user } = addUser({ id: socket.id, ...options })

        if (error) {
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('message', generateMessage('Admin', 'Bem vindo(a)!'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', '"' + user.username + '" entrou no chat!'))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)
        const filter = new Filter()

        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed!')
        }

        io.to(user.room).emit('message', generateMessage(user.username, message))
        callback()
    })

    // socket.on('sendLocation', (coords, callback) => {
    //     const user = getUser(socket.id)
    //     io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
    //     callback()
    // })

    socket.on('sendTyping', () => {
        const user = getUser(socket.id)
        socket.to(user.room).emit('typing', generateTypingMessage(user.username))
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} foi desconectado!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})
httpsServer.listen(sslPort, () => {
    console.log(`Secure server is up on port ${sslPort}`)
})
/*server.listen(port, () => {
    console.log(`Server is up on port ${port}!`)
})*/
