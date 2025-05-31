const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { Client, GatewayIntentBits } = require('discord.js');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = process.env.PORT || 3000;

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
client.once('ready', () => {
  console.log(`✅ Connecté à Discord comme ${client.user.tag}`);
});
client.login(process.env.DISCORD_TOKEN);

wss.on('connection', (ws) => {
  console.log('🔌 Client WebSocket connecté');
  client.on('messageCreate', message => {
    if (message.channel.id === process.env.CHANNEL_ID && !message.author.bot) {
      ws.send(JSON.stringify({ content: message.content, author: message.author.username }));
    }
  });
});

app.use(express.static('public'));

server.listen(PORT, () => {
  console.log(`🌐 Serveur HTTP+WebSocket lancé sur le port ${PORT}`);
});