const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fetch = require('node-fetch');
const { Client, GatewayIntentBits } = require('discord.js');

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

// Serveur proxy pour les images Discord
app.get('/image-proxy', async (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl) return res.status(400).send('Missing image URL');

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error('Image fetch failed');

    res.setHeader('Content-Type', response.headers.get('content-type'));
    response.body.pipe(res);
  } catch (err) {
    console.error('Erreur proxy image:', err);
    res.status(500).send('Erreur serveur proxy');
  }
});

app.use(express.static('public'));

client.once('ready', () => {
  console.log(`✅ Connecté à Discord comme ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);

wss.on('connection', (ws) => {
  console.log('🔌 Client WebSocket connecté');

  client.on('messageCreate', (message) => {
    if (
      message.channel.id === process.env.CHANNEL_ID &&
      !message.author.bot
    ) {
      const attachments = message.attachments.map(att => att.url);
      const payload = {
        content: message.content,
        author: message.author.username,
        attachments
      };
      console.log('➡️ Envoi WS:', payload);
      ws.send(JSON.stringify(payload));
    }
  });
});

server.listen(PORT, () => {
  console.log(`🌐 Serveur lancé sur le port ${PORT}`);
});
