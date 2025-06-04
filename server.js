const express = require('express');
const WebSocket = require('ws');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const server = app.listen(process.env.PORT || 3000, () => {
  console.log(`✅ Serveur lancé sur le port ${server.address().port}`);
});

const wss = new WebSocket.Server({ server });

let clients = [];

wss.on('connection', (ws) => {
  clients.push(ws);
  console.log('🔌 Client WebSocket connecté');

  ws.on('close', () => {
    clients = clients.filter(c => c !== ws);
    console.log('❌ Client WebSocket déconnecté');
  });
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/image-proxy', async (req, res) => {
  try {
    const imageUrl = req.query.url;
    if (!imageUrl) return res.status(400).send('Missing url');
    
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error('Network response not ok');

    res.set('Content-Type', response.headers.get('content-type'));
    response.body.pipe(res);
  } catch (error) {
    console.error('Erreur proxy image:', error);
    res.status(500).send('Erreur proxy');
  }
});

// Simule un envoi de message test (à enlever en prod)
setInterval(() => {
  const testMessage = {
    author: 'Test',
    content: 'Message de test',
    attachments: ['https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png']
  };
  const messageStr = JSON.stringify(testMessage);
  clients.forEach(ws => ws.send(messageStr));
}, 10000);
