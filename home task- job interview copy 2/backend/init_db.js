const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('history.db');
db.serialize(()=> {
    db.run(`CREATE TABLE IF NOT EXISTS history(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        input_text TEXT,
        result_json TEXT
        )`);
});
db.close();
