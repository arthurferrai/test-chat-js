var socket = io()

// Elements
var $messageForm = document.getElementById('message-form')
var $messageFormInput = $messageForm.querySelector('input')
var $messageFormButton = $messageForm.querySelector('button')
// var $sendLocationButton = document.querySelector('#send-location')
var $messages = document.getElementById('messages')
var $typing = document.getElementById('typing')

// Templates
var messageTemplate = document.getElementById('message-template').innerHTML
var historyTemplate = document.getElementById('history-template').innerHTML
var locationMessageTemplate = document.getElementById('location-message-template').innerHTML
var sidebarTemplate = document.getElementById('sidebar-template').innerHTML

// Options
var ___options = Qs.parse(location.search, { ignoreQueryPrefix: true })
var username = ___options.username
var room = ___options.room

function autoscroll(force) {
    // New message element
    var $newMessage = $messages.lastElementChild

    // Height of the new message
    var newMessageStyles = getComputedStyle($newMessage)
    var newMessageMargin = parseInt(newMessageStyles.marginBottom)
    var newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    var visibleHeight = $messages.offsetHeight

    // Height of messages container
    var containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    var scrollOffset = $messages.scrollTop + visibleHeight

    if (force || containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

function showTyping() {
    $typing.style.visibility = "visible"
}

function hideTyping() {
    $typing.style.visibility = "hidden"
}

var peopleTyping = []

function addToTyping(username) {
    if (peopleTyping.indexOf(username) === -1) {
        peopleTyping.push(username)
    }
}

function removeFromTyping(username) {
    var userIndex = peopleTyping.indexOf(username)
    if (userIndex === -1) return
    peopleTyping.splice(userIndex, 1)
}

function formatTypingText() {
    var lenTyping = peopleTyping.length
    var text = ""
    if (lenTyping === 0) text = ''
    else if (lenTyping === 1) text = '"' + peopleTyping[0] + '" está digitando...'
    else if (lenTyping === 2) text = '"' + peopleTyping[0] + '" e "' + peopleTyping[1] + '" estão digitando...'
    else text = 'várias pessoas estão digitando...'
    $typing.innerText = text
}

socket.on('typing', function(data) {
    addToTyping(data.username)
    formatTypingText()
    setTimeout(function() {
        removeFromTyping(data.username)
        formatTypingText()
    }, 5000)
})

function appendMessage(messageData) {
    var html = Mustache.render(messageTemplate, {
        username: messageData.username,
        message: messageData.text,
        createdAt: moment(messageData.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
}

function appendHistory(messages) {
    for(var i = 0; i < messages.length; i++) {
        var message = messages[i]
        message.createdAt = moment(message.createdAt).format('h:mm a')
    }
    var html = Mustache.render(historyTemplate, { history: messages })
    $messages.insertAdjacentHTML('beforeend', html)
}

socket.on('message', function (message) {
    console.log(message)
    removeFromTyping(message.username)
    formatTypingText()
    appendMessage(message)
    autoscroll()
})

socket.on('roomData', function (roomData) {
    var sidebar = document.querySelector('#sidebar')
    if (!sidebar) return
    var room = roomData.room
    var users = roomData.users
    var html = Mustache.render(sidebarTemplate, {
        room: room,
        users: users
    })
    sidebar.innerHTML = html
})

socket.on('history', function (historyData) {
    var firstMessage = $messages.children[0]
    $messages.innerHTML = ''
    if (firstMessage) $messages.appendChild(firstMessage)

    appendHistory(historyData)
    setTimeout(function() {autoscroll(true)}, 0)
})

var timeoutHandle = null
socket.on('disconnect', function() {
    if (timeoutHandle) {
        clearTimeout(timeoutHandle)
        timeoutHandle = null
    }
    timeoutHandle = setTimeout(function() {
        window.location.assign(encodeURI('/chat.html?room=' + room + '&username=' + username))
    }, 1000)
})

socket.on('connect', function() {
    if (timeoutHandle) {
        clearTimeout(timeoutHandle)
        timeoutHandle = null
    }
})

$messageForm.addEventListener('submit', function (e) {
    e.preventDefault()

    $messageFormButton.setAttribute('disabled', 'disabled')

    var message = e.target.elements.message.value

    socket.emit('sendMessage', message, function (error) {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if (error) {
            return console.log(error)
        }

        console.log('Message delivered!')
    })
})

$messageFormInput.addEventListener('keypress', function() {
    console.log("emit typing")
    socket.emit('sendTyping')
})

socket.emit('join', { username: username, room: room }, function (error) {
    if (error) {
        alert(error)
        location.href = '/?room=' + room
    }
})
