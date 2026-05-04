const BASE_URL = "http://localhost:8000";
const DEFAULT_LIMIT = 5;

const tableBody = document.getElementById("tableBody");
const pageInfo = document.getElementById("pageInfo");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const messageEl = document.getElementById("message");

let currentPage = 1;
let totalPages = 1;
let limit = DEFAULT_LIMIT;
let searchKeyword = "";

function renderRows(rows) {
  if (!rows.length) {
    tableBody.innerHTML = '<tr><td colspan="4">Không có dữ liệu</td></tr>';
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
          >Xóa</button>
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
  const token = localStorage.getItem("access_token");
  if (!token) {
    messageEl.textContent = "Thiếu access token. Vui lòng đăng nhập lại.";
    return;
  }

  messageEl.textContent = "";

  const url = new URL(`${BASE_URL}/users`);
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit));
  if (searchKeyword) {
    url.searchParams.set("search", searchKeyword);
  }

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      messageEl.textContent = payload.message || "Tải danh sách user thất bại.";
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
    messageEl.textContent = "Không thể kết nối server.";
  }
}

async function deleteUser(userId) {
  const token = localStorage.getItem("access_token");
  if (!token) {
    messageEl.textContent = "Thiếu access token. Vui lòng đăng nhập lại.";
    return;
  }

  const res = await fetch(`${BASE_URL}/users/${userId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload.message || "Xóa user thất bại.");
  }
}

searchBtn.addEventListener("click", () => {
  searchKeyword = searchInput.value.trim();
  loadUsers(1);
});

searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    searchKeyword = searchInput.value.trim();
    loadUsers(1);
  }
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

  const confirmed = window.confirm("Bạn có chắc muốn xóa user này?");
  if (!confirmed) {
    return;
  }

  try {
    await deleteUser(userId);
    await loadUsers(currentPage);
  } catch (error) {
    messageEl.textContent = error.message || "Xóa user thất bại.";
  }
});

loadUsers(1);
