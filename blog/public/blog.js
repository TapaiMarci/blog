// blog.js

document.addEventListener('DOMContentLoaded', () => {
  const postsContainer = document.getElementById('posts');
  const postForm = document.getElementById('post-form');

  // Betölti az összes posztot a backendről és megjeleníti
  async function loadPosts() {
    postsContainer.innerHTML = 'Betöltés...';
    try {
      const res = await fetch('/posts');
      if (!res.ok) throw new Error('Nem sikerült lekérni a posztokat');
      const posts = await res.json();
      if (posts.length === 0) {
        postsContainer.innerHTML = '<p>Nincsenek blog posztok.</p>';
        return;
      }
      postsContainer.innerHTML = '';
      posts.forEach(post => {
        postsContainer.appendChild(createPostElement(post));
      });
    } catch (error) {
      postsContainer.innerHTML = `<p>Hiba történt: ${error.message}</p>`;
    }
  }

  // Létrehozza a poszt HTML elemét
  function createPostElement(post) {
    const div = document.createElement('div');
    div.className = 'post';
    div.dataset.id = post.id;

    div.innerHTML = `
      <h3>${escapeHtml(post.title)}</h3>
      <small>Szerző: ${escapeHtml(post.author)} | Kategória: ${escapeHtml(post.category)}</small>
      <p>${escapeHtml(post.content)}</p>
      <div class="actions">
        <button class="edit-btn">Szerkesztés</button>
        <button class="delete-btn">Törlés</button>
      </div>
    `;

    // Törlés gomb esemény
    div.querySelector('.delete-btn').addEventListener('click', () => {
      if (confirm('Biztosan törlöd ezt a posztot?')) {
        deletePost(post.id);
      }
    });

    // Szerkesztés gomb esemény
    div.querySelector('.edit-btn').addEventListener('click', () => {
      openEditForm(post);
    });

    return div;
  }

  // Poszt törlése
  async function deletePost(id) {
    try {
      const res = await fetch(`/posts/${id}`, {
        method: 'DELETE'
      });
      if (res.status === 204) {
        loadPosts();
      } else {
        const errorData = await res.json();
        alert('Hiba történt a törlés során: ' + (errorData.message || 'Ismeretlen hiba'));
      }
    } catch (error) {
      alert('Hiba történt a törlés során: ' + error.message);
    }
  }

  // Szerkesztő űrlap megnyitása egy meglévő poszthoz (kitölti az űrlapot)
  function openEditForm(post) {
    // Kitöltjük az űrlapot a poszt adataival
    postForm.author.value = post.author;
    postForm.title.value = post.title;
    postForm.category.value = post.category;
    postForm.content.value = post.content;

    // Megváltoztatjuk a gomb szövegét és beállítjuk, hogy szerkesztési mód legyen
    postForm.querySelector('button[type="submit"]').textContent = 'Mentés';
    postForm.dataset.editingId = post.id;
  }

  // Űrlap visszaállítása létrehozási módra
  function resetForm() {
    postForm.reset();
    postForm.querySelector('button[type="submit"]').textContent = 'Létrehozás';
    delete postForm.dataset.editingId;
  }

  // Új poszt vagy szerkesztett poszt elküldése
  postForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const author = postForm.author.value.trim();
    const title = postForm.title.value.trim();
    const category = postForm.category.value.trim();
    const content = postForm.content.value.trim();

    if (!author || !title || !category || !content) {
      alert('Kérlek, tölts ki minden mezőt!');
      return;
    }

    const data = { author, title, category, content };

    try {
      let res;
      if (postForm.dataset.editingId) {
        // Szerkesztés
        const id = postForm.dataset.editingId;
        res = await fetch(`/posts/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      } else {
        // Új poszt létrehozása
        res = await fetch('/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      }

      if (res.ok) {
        resetForm();
        loadPosts();
      } else {
        const errorData = await res.json();
        alert('Hiba történt: ' + (errorData.message || 'Ismeretlen hiba'));
      }
    } catch (error) {
      alert('Hiba történt: ' + error.message);
    }
  });

  // Biztonságos HTML escape
  function escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  loadPosts();
});
