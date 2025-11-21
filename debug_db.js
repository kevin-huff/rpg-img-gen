const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/rpg.sqlite');

db.serialize(() => {
    console.log("--- Characters ---");
    db.all("SELECT id, name FROM characters", (err, rows) => {
        if (err) console.error(err);
        else console.log(JSON.stringify(rows, null, 2));
    });

    console.log("--- Scenes ---");
    db.all("SELECT id, title FROM scenes", (err, rows) => {
        if (err) console.error(err);
        else console.log(JSON.stringify(rows, null, 2));
    });
});

db.close();
