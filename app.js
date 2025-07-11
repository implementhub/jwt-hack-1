const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const fs = require("fs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const path = require('path');

let jwt_secret = "supersecretkey"; // Default secret key
let difficulty = false; // Default difficulty level

// Server configuration
const app = express();
const port = 1111;
app.use(bodyParser.urlencoded({ extended: false }));

// DB SQLite
const dbFile = "database.db";
const dbExists = fs.existsSync(dbFile);
const db = new sqlite3.Database(dbFile);


/******     LOAD PROPERTIES FILE    ******/
// reads secrets.properties
fs.readFileSync(path.join(__dirname, '/properties/application.properties'), 'utf8')
  .split('\n')
  .filter(line => line.trim() && !line.startsWith('#'))
  .forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length) process.env[key.trim()] = vals.join('=').trim();
  });


/****** DATABASE INITIALIZATION ******/
if (!dbExists) {
  const initSQL = fs.readFileSync("init.sql", "utf8");
  db.exec(initSQL);
}

// Path defnition
app.use(express.static(__dirname));


/***** ENDPOINTS *****/

// Post Endpoint: Login
app.post('/login', (req, res) => {
  const username = req.body.username || 'guest';
  const token = jwt.sign({ username: username, role: 'user'}, jwt_secret, { algorithm: 'HS256' });
  let responseBody = `
        <p>Willkommen, ${username}!</p>
        <p>Hier ist dein JWT-Token:</p>
        <code>${token}</code>
        <p>Nutze diesen Token für <a href="submit-token.html">Token überprüfen</a></p>`
  res.send(responseBody);
});

// Post Endpoint: Submit Token
app.post('/submit-token', (req, res) => {

  const token = req.body.token;

  try {
    const decoded = jwt.verify(token, jwt_secret, { algorithms: ['HS256'] });

    if(decoded.role === 'user') {
      let responseBody = `
        <h1>Willkommen, ${decoded.username}!</h1>
        <p>Request als User abgeschickt.</p>
        `
      if( difficulty === true) {
        responseBody += `<h3>Hier gehts zur About Seite</h3>
        <a href="http://localhost:1111/view?file=about.html">about</a>`;
      }
      return res.send(responseBody);
    }
    else if (decoded.role === 'admin') {
      return res.send(`<h1>Willkommen, ${decoded.username}!</h1><p>Request als Admin abgeschickt.</p>`);
    } else {
      return res.status(403).send('Ungültige Role.');
    }
  } catch (err) {
    return res.status(400).send('Ungültiger Token.');
  }
});

// Post Endpoint: Generate Token
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

app.get('/view', (req, res) => {
  const file = req.query.file;
  if (file.endsWith('.js')) {
    return res.status(404).send('Datei nicht gefunden oder Zugriff verweigert.');
  }
  const filePath = path.join(__dirname, file);
  res.sendFile(filePath, err => {
    if (err) {
      res.status(404).send('Datei nicht gefunden oder Zugriff verweigert.');
    }
  });
});

// Change difficulty
app.post('/set-difficulty', (req, res) => {
  difficulty = req.body.difficulty === 'true';
  res.json({ success: true, difficulty });
  console.log("SCHWIERIGKEIT SCHWER=" + difficulty)
  if(difficulty) {
    jwt_secret = process.env.JWT_SECRET.toString()
  }
});


// start the server
app.listen(port, () => {
  console.log(`🚀 Server läuft auf http://localhost:${port}`);
});
