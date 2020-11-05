const fs = require('fs')
const path = require('path')
const http = require('http')
const https = require('https')
const express = require('express')
const socketio = require('socket.io')
const { generateMessage, generateTypingMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')
const { saveMessage, getHistory, initTable } = require('./persistence/persistence')

initTable()

const privateKey = fs.readFileSync('/home/andrekamargo/afinaldx.com.br.key', 'utf-8')
const cert = fs.readFileSync('/home/andrekamargo/server.crt', 'utf-8')
const credentials = {key: privateKey, cert: cert}
const app = express()

const server = http.createServer(app)
const httpsServer = https.createServer(credentials, app)

const io = socketio(httpsServer)

const port = process.env.PORT || 8080
const sslPort = process.env.SSL_PORT || 8443
const publicDirectoryPath = './public'

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {
    socket.on('join', (options, callback) => {
        const { error, user } = addUser({ id: socket.id, ...options })

        if (error) {
            return callback(error)
        }

        socket.join(user.room)

        console.log(`${user.username} joined ${user.room}.`)

        socket.emit('message', generateMessage('Admin', 'Bem vindo(a)!'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', '"' + user.username + '" entrou no chat!'))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        getHistory(user.room)
            .then((history) => Promise.resolve(socket.emit('history', history)))
            .then(Promise.resolve(callback)).catch(console.error)
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)
        if (!user || !user.room) {
            socket.close()
            return
        }
        const messageToSend = generateMessage(user.username, message)
        io.to(user.room).emit('message', messageToSend)
        saveMessage(user.room, messageToSend)
        callback()
    })

    socket.on('sendTyping', () => {
        const user = getUser(socket.id)
        if (!user || !user.room) {
            socket.close()
            return
        }
        socket.to(user.room).emit('typing', generateTypingMessage(user.username))
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        console.log(`${(user || {}).username || 'someone'} disconnected`)

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
