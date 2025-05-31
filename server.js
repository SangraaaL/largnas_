const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { Client, GatewayIntentBits } = require('discord.js');
const fetch = require('node-fetch');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = process.env.PORT || 3000;

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once('ready', () => {
  console.log(`✅ Connecté à Discord comme ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);

// WebSocket clients
wss.on('connection', (ws) => {
  console.log('🔌 Client WebSocket connecté');

  // On envoie pas les anciens messages ici, juste les nouveaux

  // Quand un message Discord arrive
  client.on('messageCreate', message => {
    if (message.channel.id === process.env.CHANNEL_ID && !message.author.bot) {
      // On extrait le contenu et les URLs des pièces jointes
      const attachments = message.attachments.map(att => att.url);

      // On envoie un JSON aux clients websocket
      ws.send(JSON.stringify({
        content: message.content,
        author: message.author.username,
        attachments
      }));
    }
  });
});

// Proxy d’image pour contourner CORS et hotlinking
app.get('/proxy-image', async (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl) {
    return res.status(400).send('Missing url parameter');
  }

  try {
    // On récupère l’image depuis Discord CDN
    const response = await fetch(imageUrl);
    if (!response.ok) return res.status(response.status).send('Failed to fetch image');

    // On copie les headers pertinents (Content-Type)
    res.set('Content-Type', response.headers.get('content-type') || 'image/jpeg');
    // On pipe directement la réponse au client
    response.body.pipe(res);
  } catch (err) {
    console.error('Erreur proxy image:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.use(express.static('public'));

server.listen(PORT, () => {
  console.log(`🌐 Serveur HTTP+WebSocket lancé sur le port ${PORT}`);
});
