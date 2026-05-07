const BASE_URL = "http://localhost:8000";
const DEFAULT_LIMIT = 5;

const tableBody = document.getElementById("tableBody");
const pageInfo = document.getElementById("pageInfo");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const searchInput = document.getElementById("searchInput");
const roleFilter = document.getElementById("roleFilter");
const searchBtn = document.getElementById("searchBtn");
const messageEl = document.getElementById("message");
const postsBtn = document.getElementById("postsBtn");
const profileBtn = document.getElementById("profileBtn");
const logoutBtn = document.getElementById("logoutBtn");

let currentPage = 1;
let totalPages = 1;
let limit = DEFAULT_LIMIT;
let searchKeyword = "";
let selectedRole = "";
let isRedirectingToLogin = false;

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

function getAccessTokenOrRedirect() {
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

function renderRows(rows) {
  if (!rows.length) {
    tableBody.innerHTML = '<tr><td colspan="4">Khong co du lieu</td></tr>';
    return;
  }

  tableBody.innerHTML = rows
    .map((user) => {
      const isAdmin = user.role === "admin";
      return `<tr>
        <td>${user.id ?? ""}</td>
        <td>${user.username ?? ""}</td>
        <td>${user.role ?? ""}</td>
        <td>
          <button
            type="button"
            class="delete-btn"
            data-id="${user.id ?? ""}"
            ${isAdmin ? "disabled" : ""}
          >Xoa</button>
        </td>
      </tr>`;
    })
    .join("");
}

function updatePaginationUi() {
  pageInfo.textContent = `${currentPage} / ${totalPages}`;
  prevBtn.disabled = currentPage <= 1;
  nextBtn.disabled = currentPage >= totalPages;
}

async function loadUsers(page = 1) {
  const token = getAccessTokenOrRedirect();
  if (!token) return;

  messageEl.textContent = "";

  const url = new URL(`${BASE_URL}/users`);
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit));
  if (searchKeyword) {
    url.searchParams.set("search", searchKeyword);
  }
  if (selectedRole) {
    url.searchParams.set("role", selectedRole);
  }

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const payload = await res.json().catch(() => ({}));
    if (handleAuthExpiredResponse(res)) return;
    if (!res.ok) {
      messageEl.textContent = payload.message || "Tai danh sach user that bai.";
      return;
    }

    const rows = Array.isArray(payload.data) ? payload.data : [];
    const pagination = payload.pagination || {};

    currentPage = Number(pagination.current_page || page || 1);
    totalPages = Math.max(1, Number(pagination.total_pages || 1));
    limit = Number(pagination.limit || limit || DEFAULT_LIMIT);

    renderRows(rows);
    updatePaginationUi();
  } catch (error) {
    messageEl.textContent = "Khong the ket noi server.";
  }
}

async function deleteUser(userId) {
  const token = getAccessTokenOrRedirect();
  if (!token) return;

  const res = await fetch(`${BASE_URL}/users/${userId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await res.json().catch(() => ({}));
  if (handleAuthExpiredResponse(res)) return;
  if (!res.ok) {
    throw new Error(payload.message || "Xoa user that bai.");
  }
}

async function logout() {
  const token = getAccessTokenOrRedirect();
  if (!token) return;

  const res = await fetch(`${BASE_URL}/logout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await res.json().catch(() => ({}));
  if (handleAuthExpiredResponse(res)) return;
  if (!res.ok) {
    throw new Error(payload.message || "Dang xuat that bai.");
  }

  localStorage.removeItem("access_token");
  window.location.href = "../login/login.html";
}

searchBtn.addEventListener("click", () => {
  searchKeyword = searchInput.value.trim();
  selectedRole = roleFilter.value;
  loadUsers(1);
});

searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    searchKeyword = searchInput.value.trim();
    selectedRole = roleFilter.value;
    loadUsers(1);
  }
});

roleFilter.addEventListener("change", () => {
  selectedRole = roleFilter.value;
  loadUsers(1);
});

prevBtn.addEventListener("click", () => {
  if (currentPage > 1) {
    loadUsers(currentPage - 1);
  }
});

nextBtn.addEventListener("click", () => {
  if (currentPage < totalPages) {
    loadUsers(currentPage + 1);
  }
});

tableBody.addEventListener("click", async (e) => {
  const deleteBtn = e.target.closest(".delete-btn");
  if (!deleteBtn || deleteBtn.disabled) {
    return;
  }

  const userId = deleteBtn.dataset.id;
  if (!userId) {
    return;
  }

  const confirmed = window.confirm("Ban co chac muon xoa user nay?");
  if (!confirmed) {
    return;
  }

  try {
    await deleteUser(userId);
    await loadUsers(currentPage);
  } catch (error) {
    messageEl.textContent = error.message || "Xoa user that bai.";
  }
});

logoutBtn.addEventListener("click", async () => {
  try {
    await logout();
  } catch (error) {
    messageEl.textContent = error.message || "Dang xuat that bai.";
  }
});

profileBtn.addEventListener("click", () => {
  window.location.href = "../profile/profile.html";
});

postsBtn.addEventListener("click", () => {
  window.location.href = "../post/post.html";
});

loadUsers(1);
