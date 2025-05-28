const apiBase = '';

async function fetchPosts() {
  const res = await fetch(`${apiBase}/posts`);
  if (!res.ok) throw new Error('Nem sikerült betölteni a blog posztokat.');
  return res.json();
}

async function createPost(post) {
  const res = await fetch(`/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(post),
  });
  if (!res.ok) throw new Error('Nem sikerült létrehozni a blog posztot.');
  return res.json();
}

async function updatePost(id, post) {
  const res = await fetch(`/posts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(post),
  });
  if (!res.ok) throw new Error('Nem sikerült frissíteni a blog posztot.');
  return res.json();
}

async function deletePost(id) {
  const res = await fetch(`/posts/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Nem sikerült törölni a blog posztot.');
  return res.json();
}

function createPostElement(post) {
  const div = document.createElement('div');
  div.className = 'post';
  div.dataset.id = post.id;

  div.innerHTML = `
    <h3>${post.title}</h3>
    <small><strong>Szerző:</strong> ${post.author} | <strong>Kategória:</strong> ${post.category}</small>
    <p>${post.content}</p>
    <small>Kelt: ${new Date(post.created_at).toLocaleString()}</small><br/>
    <small>Utolsó módosítás: ${new Date(post.updated_at).toLocaleString()}</small>
    <div class="actions">
      <button class="edit-btn">Szerkesztés</button>
      <button class="delete-btn">Törlés</button>
    </div>
  `;

  div.querySelector('.edit-btn').addEventListener('click', () => {
    editPost(div, post);
  });

  div.querySelector('.delete-btn').addEventListener('click', async () => {
    if (confirm('Biztosan törlöd a posztot?')) {
      try {
        await deletePost(post.id);
        loadPosts();
      } catch (err) {
        alert(err.message);
      }
    }
  });

  return div;
}

function editPost(div, post) {
  const newAuthor = prompt('Új szerző:', post.author);
  if (newAuthor === null) return;
  const newTitle = prompt('Új cím:', post.title);
  if (newTitle === null) return;
  const newCategory = prompt('Új kategória:', post.category);
  if (newCategory === null) return;
  const newContent = prompt('Új tartalom:', post.content);
  if (newContent === null) return;

  updatePost(post.id, {
    author: newAuthor.trim(),
    title: newTitle.trim(),
    category: newCategory.trim(),
    content: newContent.trim(),
  })
    .then(() => loadPosts())
    .catch((err) => alert(err.message));
}

async function loadPosts() {
  try {
    const posts = await fetchPosts();
    const postsDiv = document.getElementById('posts');
    postsDiv.innerHTML = '';
    posts.forEach((post) => {
      const postEl = createPostElement(post);
      postsDiv.appendChild(postEl);
    });
  } catch (err) {
    alert(err.message);
  }
}

document.getElementById('post-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const author = document.getElementById('author').value.trim();
  const title = document.getElementById('title').value.trim();
  const category = document.getElementById('category').value.trim();
  const content = document.getElementById('content').value.trim();

  if (!author || !title || !category || !content) {
    alert('Kérlek, tölts ki minden mezőt!');
    return;
  }

  try {
    await createPost({ author, title, category, content });
    e.target.reset();
    loadPosts();
  } catch (err) {
    alert(err.message);
  }
});

loadPosts();
