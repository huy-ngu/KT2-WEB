const BASE_URL = "http://localhost:8000";

const postTableBody = document.getElementById("postTableBody");
const backBtn = document.getElementById("backBtn");
const messageEl = document.getElementById("message");
const editModal = document.getElementById("editModal");
const editForm = document.getElementById("editForm");
const editTitleInput = document.getElementById("editTitle");
const editContentInput = document.getElementById("editContent");
const closeEditBtn = document.getElementById("closeEditBtn");

let myPosts = [];
let editingPostId = null;
let isRedirectingToLogin = false;

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
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("vi-VN");
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

function redirectToLogin(message = "Phien dang nhap da het han. Vui long dang nhap lai.") {
  if (isRedirectingToLogin) return;
  isRedirectingToLogin = true;
  window.alert(message);
  localStorage.removeItem("access_token");
  window.location.href = "../login/login.html";
}

function isAccessTokenExpired(token) {
  const payload = decodeJwtPayload(token);
  return !payload?.exp || payload.exp * 1000 <= Date.now();
}

function getToken() {
  const token = localStorage.getItem("access_token");
  if (!token) {
    redirectToLogin("Vui long dang nhap lai.");
    return null;
  }

  if (isAccessTokenExpired(token)) {
    redirectToLogin();
    return null;
  }

  return token;
}

function handleAuthExpiredResponse(res) {
  if (res.status === 401) {
    redirectToLogin();
    return true;
  }

  return false;
}

function renderMyPosts(posts) {
  if (!posts.length) {
    postTableBody.innerHTML = `
      <tr>
        <td colspan="5">Bạn chưa có bài viết nào.</td>
      </tr>
    `;
    return;
  }

  postTableBody.innerHTML = posts
    .map(
      (post) => `
        <tr>
          <td>${escapeHtml(post.id)}</td>
          <td>${escapeHtml(post.title)}</td>
          <td>${escapeHtml(post.content)}</td>
          <td>${escapeHtml(formatDate(post.created_at))}</td>
          <td>
            <button type="button" class="edit-btn" data-id="${escapeHtml(post.id)}">Sửa</button>
            <button type="button" class="delete-btn" data-id="${escapeHtml(post.id)}">Xóa</button>
          </td>
        </tr>
      `
    )
    .join("");
}

function openEditModal(post) {
  editingPostId = post.id;
  editTitleInput.value = post.title ?? "";
  editContentInput.value = post.content ?? "";
  editModal.classList.remove("hidden");
}

function closeEditModal() {
  editingPostId = null;
  editForm.reset();
  editModal.classList.add("hidden");
}

async function loadMyPosts() {
  const token = getToken();
  if (!token) return;

  try {
    const res = await fetch(`${BASE_URL}/mypost`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const payload = await res.json().catch(() => ({}));
    if (handleAuthExpiredResponse(res)) return;
    if (!res.ok) {
      postTableBody.innerHTML = `
        <tr>
          <td colspan="5">${escapeHtml(payload.message || "Khong tai duoc bai viet.")}</td>
        </tr>
      `;
      return;
    }

    myPosts = Array.isArray(payload.data) ? payload.data : [];
    messageEl.textContent = "";
    renderMyPosts(myPosts);
  } catch (error) {
    postTableBody.innerHTML = `
      <tr>
        <td colspan="5">Khong the ket noi server.</td>
      </tr>
    `;
  }
}

async function updatePost(postId, title, content) {
  const token = getToken();
  if (!token) return;

  const res = await fetch(`${BASE_URL}/posts/${postId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title, content }),
  });

  const payload = await res.json().catch(() => ({}));
  if (handleAuthExpiredResponse(res)) return;
  if (!res.ok) {
    throw new Error(payload.message || "Cap nhat bai viet that bai.");
  }
}

async function deletePost(postId) {
  const token = getToken();
  if (!token) return;

  const res = await fetch(`${BASE_URL}/posts/${postId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await res.json().catch(() => ({}));
  if (handleAuthExpiredResponse(res)) return;
  if (!res.ok) {
    throw new Error(payload.message || "Xoa bai viet that bai.");
  }
}

postTableBody.addEventListener("click", async (event) => {
  const editBtn = event.target.closest(".edit-btn");
  const deleteBtn = event.target.closest(".delete-btn");

  if (editBtn) {
    const post = myPosts.find((item) => String(item.id) === editBtn.dataset.id);
    if (post) {
      openEditModal(post);
    }
    return;
  }

  if (deleteBtn) {
    const postId = deleteBtn.dataset.id;
    if (!window.confirm("Ban co chac muon xoa bai viet nay?")) {
      return;
    }

    try {
      await deletePost(postId);
      await loadMyPosts();
    } catch (error) {
      messageEl.textContent = error.message || "Xóa bài viết thất bại.";
    }
  }
});

editForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!editingPostId) return;

  const title = editTitleInput.value.trim();
  const content = editContentInput.value.trim();

  if (!title || !content) {
    messageEl.textContent = "Tiêu đề và nội dung không được để trống.";
    return;
  }

  try {
    await updatePost(editingPostId, title, content);
    closeEditModal();
    await loadMyPosts();
  } catch (error) {
    messageEl.textContent = error.message || "Cập nhật bài viết thất bại.";
  }
});

closeEditBtn.addEventListener("click", closeEditModal);
editModal.addEventListener("click", (event) => {
  if (event.target === editModal) {
    closeEditModal();
  }
});

backBtn.addEventListener("click", () => {
  window.location.href = "../profile/profile.html";
});

loadMyPosts();
