import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = 3000;

// Déterminer le chemin du répertoire actuel
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir les fichiers statiques depuis le dossier 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Route pour le proxy d'images
app.get('/image-proxy', async (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl) {
    return res.status(400).send('URL requise');
  }

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Échec de la récupération de l'image: ${response.statusText}`);
    }
    const contentType = response.headers.get('content-type');
    res.set('Content-Type', contentType);
    response.body.pipe(res);
  } catch (error) {
    console.error('Erreur proxy image:', error);
    res.status(500).send('Erreur lors de la récupération de l\'image');
  }
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
