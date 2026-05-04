const BASE_URL = "http://localhost:8000";
const PAGE_SIZE = 10;

const searchInput = document.getElementById("searchInput");
const tableHead = document.getElementById("tableHead");
const tableBody = document.getElementById("tableBody");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const pageInfo = document.getElementById("pageInfo");
const messageEl = document.getElementById("message");
const openCreateModalBtn = document.getElementById("openCreateModalBtn");
const closeCreateModalBtn = document.getElementById("closeCreateModalBtn");
const createPostModal = document.getElementById("createPostModal");
const createPostForm = document.getElementById("createPostForm");
const createTitleInput = document.getElementById("createTitle");
const createContentInput = document.getElementById("createContent");

let posts = [];
let currentPage = 1;
let totalPages = 1;
let currentUserId = null;

function decodeJwtPayload(token) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  try {
    return JSON.parse(atob(base64));
  } catch (error) {
    return null;
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("vi-VN");
}

function renderTable() {
  tableHead.innerHTML = `
    <tr>
      <th>Title</th>
      <th>Content</th>
      <th>Ngày tạo</th>
      <th>Ngày sửa</th>
      <th>Thao tác</th>
    </tr>
  `;

  if (!posts.length) {
    tableBody.innerHTML = "";
    pageInfo.textContent = `${currentPage} / ${totalPages}`;
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    return;
  }

  tableBody.innerHTML = posts
    .map((item) => {
      const createdValue = item.created_at ?? item.createdAt;
      const updatedValue = item.updated_at ?? item.updatedAt;
      const isOwner = Number(item.user_id) === Number(currentUserId);
      const actionHtml = isOwner
        ? `
          <button type="button" class="edit-btn" data-id="${item.id}">Sửa</button>
          <button type="button" class="delete-btn" data-id="${item.id}">Xóa</button>
        `
        : "";

      return `
        <tr>
          <td>${escapeHtml(item.title)}</td>
          <td>${escapeHtml(item.content)}</td>
          <td>${formatDate(createdValue)}</td>
          <td>${formatDate(updatedValue)}</td>
          <td>${actionHtml}</td>
        </tr>
      `;
    })
    .join("");

  pageInfo.textContent = `${currentPage} / ${totalPages}`;
  prevBtn.disabled = currentPage <= 1;
  nextBtn.disabled = currentPage >= totalPages;
}

function applySearch() {
  currentPage = 1;
  loadPosts();
}

function openCreateModal() {
  createPostModal.classList.remove("hidden");
}

function closeCreateModal() {
  createPostModal.classList.add("hidden");
  createPostForm.reset();
}

async function loadPosts() {
  const token = localStorage.getItem("access_token");
  if (!token) {
    messageEl.textContent = "Thiếu access token. Vui lòng đăng nhập lại.";
    return;
  }

  try {
    const keyword = searchInput.value.trim();
    const query = new URLSearchParams({
      page: String(currentPage),
      limit: String(PAGE_SIZE),
    });
    if (keyword) {
      query.set("title", keyword);
    }

    const res = await fetch(`${BASE_URL}/posts?${query.toString()}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      messageEl.textContent = data.message || "Không tải được danh sách post.";
      return;
    }

    const payload = data?.data ?? {};
    posts = Array.isArray(payload.data) ? payload.data : [];
    const pagination = payload.pagination ?? {};
    currentPage = Number(pagination.current_page || currentPage || 1);
    totalPages = Math.max(1, Number(pagination.total_pages || 1));
    messageEl.textContent = "";
    renderTable();
  } catch (error) {
    messageEl.textContent = "Không thể kết nối server.";
  }
}

async function createPost(title, content) {
  const token = localStorage.getItem("access_token");
  if (!token) {
    messageEl.textContent = "Thiếu access token. Vui lòng đăng nhập lại.";
    return;
  }

  const res = await fetch(`${BASE_URL}/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title, content }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Tạo post thất bại.");
  }
}

async function updatePost(postId, title, content) {
  const token = localStorage.getItem("access_token");
  const res = await fetch(`${BASE_URL}/posts/${postId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title, content }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Cập nhật post thất bại.");
  }
}

async function deletePost(postId) {
  const token = localStorage.getItem("access_token");
  const res = await fetch(`${BASE_URL}/posts/${postId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Xóa post thất bại.");
  }
}

searchInput.addEventListener("input", applySearch);
prevBtn.addEventListener("click", () => {
  currentPage -= 1;
  loadPosts();
});
nextBtn.addEventListener("click", () => {
  currentPage += 1;
  loadPosts();
});
openCreateModalBtn.addEventListener("click", openCreateModal);
closeCreateModalBtn.addEventListener("click", closeCreateModal);
createPostModal.addEventListener("click", (e) => {
  if (e.target === createPostModal) {
    closeCreateModal();
  }
});

createPostForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = createTitleInput.value.trim();
  const content = createContentInput.value.trim();

  if (!title || !content) {
    return;
  }

  try {
    await createPost(title, content);
    closeCreateModal();
    await loadPosts();
  } catch (error) {
    messageEl.textContent = error.message || "Tạo post thất bại.";
  }
});

tableBody.addEventListener("click", async (e) => {
  const editBtn = e.target.closest(".edit-btn");
  const deleteBtn = e.target.closest(".delete-btn");

  if (editBtn) {
    const postId = editBtn.dataset.id;
    const post = posts.find((item) => String(item.id) === String(postId));
    if (!post) return;

    const newTitle = prompt("Nhập title mới:", post.title ?? "");
    if (newTitle === null) return;
    const newContent = prompt("Nhập content mới:", post.content ?? "");
    if (newContent === null) return;

    try {
      await updatePost(postId, newTitle.trim(), newContent.trim());
      await loadPosts();
    } catch (error) {
      messageEl.textContent = error.message || "Cập nhật post thất bại.";
    }
  }

  if (deleteBtn) {
    const postId = deleteBtn.dataset.id;
    if (!confirm("Bạn có chắc muốn xóa post này?")) return;

    try {
      await deletePost(postId);
      await loadPosts();
    } catch (error) {
      messageEl.textContent = error.message || "Xóa post thất bại.";
    }
  }
});

(() => {
  const token = localStorage.getItem("access_token");
  if (!token) return;
  const payload = decodeJwtPayload(token);
  currentUserId = Number(payload?.sub || 0) || null;
})();

loadPosts();
