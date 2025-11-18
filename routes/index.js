var express = require('express');
var router = express.Router();

const fs = require('fs');
const path = require('path');

const multer = require('multer');

// Configuration dynamique de multer pour cibler le bon dossier
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const targetFolder = req.body.targetFolder;
    const uploadsPath = path.join(__dirname, '../uploads');
    const dest = path.join(uploadsPath, targetFolder);
    if (!fs.existsSync(dest)) {
      return cb(new Error('Le dossier cible n\'existe pas.'));
    }
    cb(null, dest);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage: storage });

/* GET home page. */
router.get('/', function(req, res, next) {
  const uploadsPath = path.join(__dirname, '../uploads');
  let folders = [];
  let files = {};
  if (fs.existsSync(uploadsPath)) {
    folders = fs.readdirSync(uploadsPath).filter(f => fs.statSync(path.join(uploadsPath, f)).isDirectory());
    folders.forEach(folder => {
      const folderPath = path.join(uploadsPath, folder);
      files[folder] = fs.readdirSync(folderPath);
    });
  }
  res.render('index', { title: 'Bureau', folders, files });
});

// Route POST pour créer un dossier
router.post('/create-folder', function(req, res, next) {
  const folderName = req.body.folderName;
  if (!folderName) {
    return res.status(400).json({ error: 'Le nom du dossier est requis.' });
  }
  const uploadsPath = path.join(__dirname, '../uploads');
  const newFolderPath = path.join(uploadsPath, folderName);
  if (fs.existsSync(newFolderPath)) {
    return res.status(400).json({ error: 'Le dossier existe déjà.' });
  }
  fs.mkdir(newFolderPath, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Erreur lors de la création du dossier.' });
    }
    res.json({ success: true, folder: folderName });
  });
});


// Route POST pour supprimer un dossier et son contenu
router.post('/delete-folder', function(req, res) {
  const folderName = req.body.folderName;
  if (!folderName) {
    return res.status(400).json({ error: 'Le nom du dossier est requis.' });
  }
  const uploadsPath = path.join(__dirname, '../uploads');
  const folderPath = path.join(uploadsPath, folderName);
  if (!fs.existsSync(folderPath)) {
    return res.status(404).json({ error: 'Le dossier n\'existe pas.' });
  }
  // Suppression récursive
  fs.rm(folderPath, { recursive: true, force: true }, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Erreur lors de la suppression du dossier.' });
    }
    res.json({ success: true });
  });
});

module.exports = router;

// Route POST pour uploader un fichier dans un dossier
router.post('/upload', upload.single('document'), function(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'Aucun fichier reçu ou dossier cible inexistant.' });
  }
  res.json({ success: true, file: req.file.filename, folder: req.body.targetFolder });
});
