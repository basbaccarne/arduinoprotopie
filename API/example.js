// link-server.js
const express = require('express');
const app = express();
const port = 3000;

// parse JSON bodies
app.use(express.json());

// === 1️⃣ Receive events from Pie ===
// In Protopie:
// POST
// URL: http://localhost:3000/pie-event
// BODY: {  "pieId": 52,  "event": "buttonPress",  "value": 1}

app.post('/pie-event', (req, res) => {
  console.log('Event received from Pie:', req.body);
  res.send({ message: 'ok' });
});

// === 2️⃣ Provide commands back to Pie ===
// Pie will poll this endpoint to get commands
let latestCommand = { message: 'value' };

app.get('/pie-commands', (req, res) => {
  res.send(latestCommand);
});

// === 3️⃣ Optional: set commands manually in Node.js console ===
app.post('/set-command', (req, res) => {
  latestCommand = req.body;
  console.log('Command updated:', latestCommand);
  res.send({ status: 'ok' });
});

app.listen(port, () => console.log(`Node.js Link replacement running at http://localhost:${port}`));
