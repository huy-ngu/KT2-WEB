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
const updatePostModal = document.getElementById("updatePostModal");
const updatePostForm = document.getElementById("updatePostForm");
const closeUpdateModalBtn = document.getElementById("closeUpdateModalBtn");
const updateTitleInput = document.getElementById("updateTitle");
const updateContentInput = document.getElementById("updateContent");
const profileBtn = document.getElementById("profileBtn");
const logoutBtn = document.getElementById("logoutBtn");

let posts = [];
let currentPage = 1;
let totalPages = 1;
let currentUserId = null;
let tableColumns = [];
let editingPostId = null;

function normalizePostResponse(raw) {
  if (Array.isArray(raw)) {
    return { rows: raw, pagination: {} };
  }

  if (Array.isArray(raw?.data)) {
    return { rows: raw.data, pagination: raw.pagination ?? {} };
  }

  if (Array.isArray(raw?.data?.data)) {
    return { rows: raw.data.data, pagination: raw.data.pagination ?? {} };
  }

  if (Array.isArray(raw?.posts)) {
    return { rows: raw.posts, pagination: raw.pagination ?? {} };
  }

  return { rows: [], pagination: raw?.pagination ?? {} };
}

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

function collectColumns(rows) {
  const colSet = new Set();
  rows.forEach((row) => {
    Object.keys(row || {}).forEach((key) => colSet.add(key));
  });
  return Array.from(colSet);
}

function formatCellValue(key, value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return escapeHtml(JSON.stringify(value));
  if (
    /(^|_)(created|updated)_at$/i.test(key) ||
    /^(createdAt|updatedAt)$/i.test(key)
  ) {
    return escapeHtml(formatDate(value));
  }
  return escapeHtml(value);
}

function renderTable() {
  const headHtml = tableColumns
    .map((col) => `<th>${escapeHtml(col)}</th>`)
    .join("");
  tableHead.innerHTML = `<tr>${headHtml}<th>Thao tác</th></tr>`;

  if (!posts.length) {
    const colspan = Math.max(1, tableColumns.length + 1);
    tableBody.innerHTML = `<tr><td colspan="${colspan}">Không có dữ liệu</td></tr>`;
    pageInfo.textContent = `${currentPage} / ${totalPages}`;
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    return;
  }

  tableBody.innerHTML = posts
    .map((item) => {
      const itemUserId = Number(item.user_id ?? item.userId ?? 0);
      const isOwner = itemUserId === Number(currentUserId);
      const actionHtml = `
        <button type="button" class="edit-btn" data-id="${item.id}" ${isOwner ? "" : "disabled"}>Sửa</button>
        <button type="button" class="delete-btn" data-id="${item.id}" ${isOwner ? "" : "disabled"}>Xóa</button>
      `;

      return `
        <tr>
          ${tableColumns.map((col) => `<td>${formatCellValue(col, item[col])}</td>`).join("")}
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

function openUpdateModal(post) {
  editingPostId = post.id;
  updateTitleInput.value = post.title ?? "";
  updateContentInput.value = post.content ?? "";
  updatePostModal.classList.remove("hidden");
}

function closeUpdateModal() {
  updatePostModal.classList.add("hidden");
  updatePostForm.reset();
  editingPostId = null;
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

    const normalized = normalizePostResponse(data);
    posts = normalized.rows;
    tableColumns = collectColumns(posts);
    const pagination = normalized.pagination ?? {};
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

async function logout() {
  const token = localStorage.getItem("access_token");
  if (!token) {
    messageEl.textContent = "Thiếu access token. Vui lòng đăng nhập lại.";
    return;
  }

  const res = await fetch(`${BASE_URL}/logout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload.message || "Đăng xuất thất bại.");
  }

  localStorage.removeItem("access_token");
  window.location.href = "../login/login.html";
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
closeUpdateModalBtn.addEventListener("click", closeUpdateModal);
updatePostModal.addEventListener("click", (e) => {
  if (e.target === updatePostModal) {
    closeUpdateModal();
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

updatePostForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!editingPostId) {
    return;
  }

  const title = updateTitleInput.value.trim();
  const content = updateContentInput.value.trim();

  if (!title || !content) {
    return;
  }

  try {
    await updatePost(editingPostId, title, content);
    closeUpdateModal();
    await loadPosts();
  } catch (error) {
    messageEl.textContent = error.message || "Cập nhật post thất bại.";
  }
});

tableBody.addEventListener("click", async (e) => {
  const editBtn = e.target.closest(".edit-btn");
  const deleteBtn = e.target.closest(".delete-btn");

  if (editBtn) {
    const postId = editBtn.dataset.id;
    const post = posts.find((item) => String(item.id) === String(postId));
    if (!post) return;

    openUpdateModal(post);
    return;
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

logoutBtn.addEventListener("click", async () => {
  try {
    await logout();
  } catch (error) {
    messageEl.textContent = error.message || "Đăng xuất thất bại.";
  }
});

profileBtn.addEventListener("click", () => {
  window.location.href = "../profile/profile.html";
});

(() => {
  const token = localStorage.getItem("access_token");
  if (!token) return;
  const payload = decodeJwtPayload(token);
  currentUserId = Number(payload?.sub || 0) || null;
})();

loadPosts();
