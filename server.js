const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { Client, GatewayIntentBits } = require('discord.js');
const path = require('path');

// Import compatible node-fetch (ESM workaround)
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = process.env.PORT || 3000;

// Discord bot
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log(`✅ Connecté à Discord comme ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);

// WebSocket pour overlay
wss.on('connection', (ws) => {
  console.log('🔌 Client WebSocket connecté');
  client.on('messageCreate', message => {
    if (message.channel.id === process.env.CHANNEL_ID && !message.author.bot) {
      const attachments = message.attachments.map(att => att.url);
      const payload = {
        content: message.content,
        author: message.author.username,
        attachments
      };
      console.log('Envoi payload WS:', payload);
      ws.send(JSON.stringify(payload));
    }
  });
});

// Proxy pour images (contourne les problèmes CORS dans OBS)
app.get('/image-proxy', async (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl) return res.status(400).send('Missing URL');

  try {
    const response = await fetch(imageUrl);
    const contentType = response.headers.get('content-type');
    res.set('Content-Type', contentType);
    response.body.pipe(res);
  } catch (err) {
    console.error('Erreur proxy image:', err);
    res.status(500).send('Erreur proxy');
  }
});

// Sert les fichiers du dossier public
app.use(express.static(path.join(__dirname, 'public')));

// Lancement du serveur
server.listen(PORT, () => {
  console.log(`🌐 Serveur lancé sur le port ${PORT}`);
});
