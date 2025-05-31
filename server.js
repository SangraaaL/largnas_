const express = require('express');
const { WebSocketServer } = require('ws');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 3000;

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// Proxy pour contourner CORS
app.get('/image-proxy', async (req, res) => {
  try {
    const imageUrl = req.query.url;
    const response = await fetch(imageUrl);
    const contentType = response.headers.get('content-type');
    res.setHeader('Content-Type', contentType);
    response.body.pipe(res);
  } catch (error) {
    console.error('Erreur proxy image:', error);
    res.status(500).send('Erreur proxy image');
  }
});

const server = app.listen(PORT, () => {
  console.log(`✅ Serveur HTTP en écoute sur le port ${PORT}`);
});

const wss = new WebSocketServer({ server });

wss.on('connection', ws => {
  console.log('🌐 Client WebSocket connecté');

  // Simule un message de test pour debug rapide
  ws.send(JSON.stringify({
    author: "Bot",
    content: "Ceci est un test",
    attachments: ["https://cdn.discordapp.com/attachments/0000000000000/test.jpg"]
  }));
});
