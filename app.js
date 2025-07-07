const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const fs = require("fs");
const jwt = require("jsonwebtoken");

// JS Server
const app = express();
const port = 1111;
const SECRET_KEY = "supersecretkey";

app.use(bodyParser.urlencoded({ extended: false }));

// DB SQLite
const dbFile = "database.db";
const dbExists = fs.existsSync(dbFile);
const db = new sqlite3.Database(dbFile);

if (!dbExists) {
  const initSQL = fs.readFileSync("init.sql", "utf8");
  db.exec(initSQL);
}

app.use(express.static(__dirname));

//
app.post('/login', (req, res) => {
  const username = req.body.username || 'guest';
  const token = jwt.sign({ username: username, role: 'user'}, SECRET_KEY, { algorithm: 'HS256' });
  res.send(`
        <p>Willkommen, ${username}!</p>
        <p>Hier ist dein JWT-Token:</p>
        <code>${token}</code>
        <p>Nutze diesen Token für <a href="submit-token.html">Token überprüfen</a></p>
    `);
});

//
app.post('/submit-token', (req, res) => {

  const token = req.body.token;

  try {
    const decoded = jwt.verify(token, SECRET_KEY, { algorithms: ['HS256'] });

    if(decoded.role === 'user') {
      return res.send(`<h1>Willkommen, ${decoded.username}!</h1><p>Du bist als User eingelogged.</p>`);
    }
    else if (decoded.role === 'admin') {
      return res.send(`<h1>Willkommen, ${decoded.username}!</h1><p>Du bist als Admin eingelogged.</p>`);
    } else {
      return res.status(403).send('Ungültige Role.');
    }
  } catch (err) {
    return res.status(400).send('Ungültiger Token.');
  }
});

//
app.post('/generate-token', (req, res) => {
  const payload = req.body.payload;
  const secret = req.body.secret;
  let parsedPayload;
  try {
    parsedPayload = JSON.parse(payload);
  } catch (e) {
    return res.status(400).send('Ungültiges JSON im Payload.');
  }
  const token = jwt.sign(parsedPayload, secret, { algorithm: 'HS256' });
  res.send(token);
});

app.listen(port, () => {
  console.log(`🚀 Server läuft auf http://localhost:${port}`);
});
