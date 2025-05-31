const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { Client, GatewayIntentBits } = require('discord.js');
const fetch = require('node-fetch');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = process.env.PORT || 3000;

const client = new Client({ intents: [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent
]});

client.once('ready', () => {
  console.log(`✅ Connecté à Discord comme ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);

wss.on('connection', (ws) => {
  console.log('🔌 Client WebSocket connecté');

  // On écoute les messages Discord et on les envoie aux clients WS
  client.on('messageCreate', message => {
    if (message.channel.id === process.env.CHANNEL_ID && !message.author.bot) {
      const attachments = message.attachments.map(att => att.url);
      ws.send(JSON.stringify({
        content: message.content,
        author: message.author.username,
        attachments: attachments
      }));
    }
  });
});

// Proxy pour les images
app.get('/image-proxy', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) return res.status(400).send('Missing url param');

    const response = await fetch(url);
    if (!response.ok) return res.status(500).send('Error fetching image');

    // On forward le Content-Type du serveur source
    res.setHeader('Content-Type', response.headers.get('content-type'));
    response.body.pipe(res);
  } catch (error) {
    console.error('Erreur proxy image:', error);
    res.status(500).send('Proxy error');
  }
});

app.use(express.static('public'));

server.listen(PORT, () => {
  console.log(`🌐 Serveur HTTP+WebSocket lancé sur le port ${PORT}`);
});
