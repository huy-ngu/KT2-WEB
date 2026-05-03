const BASE_URL = "http://localhost:8000";
const PAGE_SIZE = 10;

const searchInput = document.getElementById("searchInput");
const tableHead = document.getElementById("tableHead");
const tableBody = document.getElementById("tableBody");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const pageInfo = document.getElementById("pageInfo");
const messageEl = document.getElementById("message");

let allPosts = [];
let filteredPosts = [];
let currentPage = 1;

function normalizeList(raw) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.data?.items)) return raw.data.items;
  if (Array.isArray(raw?.posts)) return raw.posts;
  return [];
}

function getColumns(items) {
  if (!items.length) return [];
  return ["title", "content", "created_at", "updated_at"];
}

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("vi-VN");
}

function renderTable() {
  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = totalPages;

  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filteredPosts.slice(start, start + PAGE_SIZE);
  const columns = getColumns(filteredPosts);

  if (!columns.length) {
    tableHead.innerHTML = "";
    tableBody.innerHTML = "";
    pageInfo.textContent = "0 / 0";
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    return;
  }

  const headers = {
    title: "Title",
    content: "Content",
    created_at: "Ngày tạo",
    updated_at: "Ngày sửa",
  };

  tableHead.innerHTML = `<tr>${columns.map((c) => `<th>${headers[c] || c}</th>`).join("")}</tr>`;
  tableBody.innerHTML = pageItems
    .map((item) => {
      const createdValue = item.created_at ?? item.createdAt;
      const updatedValue = item.updated_at ?? item.updatedAt;

      return `<tr>${columns
        .map((c) => {
          if (c === "created_at") return `<td>${formatDate(createdValue)}</td>`;
          if (c === "updated_at") return `<td>${formatDate(updatedValue)}</td>`;
          return `<td>${item[c] ?? ""}</td>`;
        })
        .join("")}</tr>`;
    })
    .join("");

  pageInfo.textContent = `${currentPage} / ${totalPages}`;
  prevBtn.disabled = currentPage <= 1;
  nextBtn.disabled = currentPage >= totalPages;
}

function applySearch() {
  const keyword = searchInput.value.trim().toLowerCase();
  if (!keyword) {
    filteredPosts = [...allPosts];
  } else {
    filteredPosts = allPosts.filter((item) =>
      JSON.stringify(item).toLowerCase().includes(keyword),
    );
  }
  currentPage = 1;
  renderTable();
}

async function loadPosts() {
  const token = localStorage.getItem("access_token");
  if (!token) {
    messageEl.textContent = "Thiếu access token. Vui lòng đăng nhập lại.";
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/posts`, {
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

    allPosts = normalizeList(data);
    filteredPosts = [...allPosts];
    renderTable();
  } catch (error) {
    messageEl.textContent = "Không thể kết nối server.";
  }
}

searchInput.addEventListener("input", applySearch);
prevBtn.addEventListener("click", () => {
  currentPage -= 1;
  renderTable();
});
nextBtn.addEventListener("click", () => {
  currentPage += 1;
  renderTable();
});

loadPosts();
