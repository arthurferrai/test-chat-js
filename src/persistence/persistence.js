const sqlite3 = require('sqlite3')

const daysToPersist = 4

let db_available = false

const db = new sqlite3.Database('./history.db', (err) => {
  if (err) {
    console.error('Error opening database, history not available.')
    db_available = false
  } else {
    console.log('Database loaded fine.')
    db_available = true
  }
})

const initTable = () => {
  const days = parseInt(daysToPersist, 10) || 30
  db.serialize(() => {
    db.exec(`CREATE TABLE IF NOT EXISTS History (
      RoomName TEXT,
      username TEXT,
      "text" TEXT,
      createdAt INTEGER
    );`)
    db.exec('DROP TRIGGER IF EXISTS trigger_remove_old;')
    db.exec(`CREATE TRIGGER trigger_remove_old AFTER INSERT ON History
      BEGIN
        DELETE FROM History WHERE DATETIME(createdAt) > DATETIME('now', '-${days} days');
      END;`)
  })
}

const saveMessage = (roomName, {username, text, createdAt}) => {
  if (!db_available) return
  const query = 'INSERT INTO History (RoomName, username, "text", createdAt) VALUES (?, ?, ?, ?);'
  db.run(query, [roomName, username, text, parseInt(createdAt/1000, 10)])
}

const getHistory = (roomName) => {
  if (!db_available) return []
  return new Promise(resolve => {
    const query = 'SELECT username, text, createdAt*1000 as createdAt FROM History WHERE RoomName = ?;'
    db.all(query, [roomName], (err, rows) => {
      if (err) throw err
      resolve(rows)
    })
  })
}

module.exports = {
  saveMessage,
  getHistory,
  initTable
}