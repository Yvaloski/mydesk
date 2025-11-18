// Code JS pour le bureau Windows-like
window.addEventListener('DOMContentLoaded', function() {
  // Affichage des modals d'action
  document.getElementById('btn-add-folder').onclick = function() {
    document.getElementById('modal-create-folder').style.display = 'block';
  };
  document.getElementById('btn-upload').onclick = function() {
    document.getElementById('modal-upload').style.display = 'block';
  };

  // Drag & drop desktop icons avec sauvegarde/restauration des positions
  let dragged = null;
  const files = window.desktopFiles;
  const defaultX = 40, defaultY = 40, stepY = 100;
  function restorePositions() {
    const saved = JSON.parse(localStorage.getItem('desktopPositions') || '{}');
    document.querySelectorAll('.desktop-icon').forEach((icon, i) => {
      const folder = icon.dataset.folder;
      if (saved[folder]) {
        icon.style.left = saved[folder].left;
        icon.style.top = saved[folder].top;
      } else {
        icon.style.left = defaultX + 'px';
        icon.style.top = (defaultY + i*stepY) + 'px';
      }
    });
  }
  restorePositions();
  function savePositions() {
    const positions = {};
    document.querySelectorAll('.desktop-icon').forEach(icon => {
      positions[icon.dataset.folder] = {
        left: icon.style.left,
        top: icon.style.top
      };
    });
    localStorage.setItem('desktopPositions', JSON.stringify(positions));
  }
  document.querySelectorAll('.desktop-icon').forEach(icon => {
    icon.addEventListener('dragstart', function(e) {
      dragged = this;
      e.dataTransfer.setData('text/plain', this.dataset.folder);
    });
    icon.addEventListener('dragend', function(e) {
      dragged = null;
    });
    icon.addEventListener('dblclick', function(e) {
      // Afficher le contenu du dossier dans la modal
      const folder = this.dataset.folder;
      document.getElementById('modal-folder-name').innerText = folder;
      const fileList = files[folder] || [];
      const ul = document.getElementById('modal-folder-files');
      ul.innerHTML = '';
      if(fileList.length === 0) {
        ul.innerHTML = '<li><em>(vide)</em></li>';
      } else {
        fileList.forEach(f => {
          const li = document.createElement('li');
          li.innerText = f;
          ul.appendChild(li);
        });
      }
      // Affiche le bouton supprimer et stocke le nom du dossier courant
      const delBtn = document.getElementById('delete-folder-modal-btn');
      delBtn.style.display = 'inline-block';
      delBtn.dataset.folder = folder;
      document.getElementById('folder-modal').style.display = 'block';
    });
  });
  document.getElementById('desktop').addEventListener('dragover', function(e) {
    e.preventDefault();
  });
  document.getElementById('desktop').addEventListener('drop', function(e) {
    e.preventDefault();
    if (dragged) {
      dragged.style.left = (e.clientX - 40) + 'px';
      dragged.style.top = (e.clientY - 40) + 'px';
      savePositions();
    }
  });
  // Suppression de dossier depuis la modal
  document.getElementById('delete-folder-modal-btn').onclick = async function() {
    const folder = this.dataset.folder;
    if(confirm('Supprimer le dossier "' + folder + '" ?')) {
      const res = await fetch('/delete-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderName: folder })
      });
      const json = await res.json();
      document.getElementById('result').innerText = json.success ? `Dossier supprimé: ${folder}` : `Erreur: ${json.error}`;
      if(json.success) location.reload();
    }
  };
  // Création de dossier sans recharger la page
  document.getElementById('create-folder-form').onsubmit = async function(e) {
    e.preventDefault();
    const form = e.target;
    const data = new URLSearchParams(new FormData(form));
    const res = await fetch(form.action, { method: 'POST', body: data });
    const json = await res.json();
    document.getElementById('result').innerText = json.success ? `Dossier créé: ${json.folder}` : `Erreur: ${json.error}`;
    if(json.success) location.reload();
  };
  // Upload sans recharger la page
  document.getElementById('upload-form').onsubmit = async function(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const res = await fetch(form.action, { method: 'POST', body: formData });
    const json = await res.json();
    document.getElementById('result').innerText = json.success ? `Fichier uploadé: ${json.file}` : `Erreur: ${json.error}`;
    if(json.success) location.reload();
  };
});
