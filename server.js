const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { Client, GatewayIntentBits } = require('discord.js');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = process.env.PORT || 3000;

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

// Envoi des messages aux clients WebSocket
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
      console.log('📤 Envoi payload WS:', payload);
      ws.send(JSON.stringify(payload));
    }
  });
});

// Proxy d'image pour contourner les restrictions Discord
app.get('/image-proxy', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) return res.status(400).send('URL manquante');

    const response = await fetch(url);
    if (!response.ok) return res.status(500).send('Erreur récupération image');

    res.set('Content-Type', response.headers.get('content-type') || 'image/png');
    response.body.pipe(res);
  } catch (err) {
    console.error('❌ Erreur proxy:', err);
    res.status(500).send('Erreur serveur');
  }
});

app.use(express.static('public'));

server.listen(PORT, () => {
  console.log(`🌐 Serveur lancé sur le port ${PORT}`);
});
