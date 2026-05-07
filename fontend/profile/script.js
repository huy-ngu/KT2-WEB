const BASE_URL = "http://localhost:8000";

const userIdEl = document.getElementById("userId");
const usernameEl = document.getElementById("username");
const roleEl = document.getElementById("role");
const messageEl = document.getElementById("message");
const backBtn = document.getElementById("backBtn");
const myPostsBtn = document.getElementById("myPostsBtn");
const logoutBtn = document.getElementById("logoutBtn");

function renderProfile(profile) {
  userIdEl.textContent = profile?.id ?? "-";
  usernameEl.textContent = profile?.username ?? "-";
  roleEl.textContent = profile?.role ?? "-";
}

async function loadProfile() {
  const token = localStorage.getItem("access_token");
  if (!token) {
    messageEl.textContent = "Thiếu access token. Vui lòng đăng nhập lại.";
    return;
  }

  messageEl.textContent = "";

  try {
    const res = await fetch(`${BASE_URL}/profile`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      messageEl.textContent = payload.message || "Không tải được profile.";
      return;
    }

    renderProfile(payload);
  } catch (error) {
    messageEl.textContent = "Không thể kết nối server.";
  }
}

async function loadMyPosts() {
  const token = localStorage.getItem("access_token");
  if (!token) {
    window.location.href = "../login/login.html";
    return;
  }

  const res = await fetch(`${BASE_URL}/profile`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    messageEl.textContent = data.message || "Không tải được bài viết người dùng.";
    return;
  }

  console.log("Bài viết của người dùng:", data);
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

backBtn.addEventListener("click", () => {
  window.location.href = "../post/post.html";
});


myPostsBtn.addEventListener("click", () => {
  window.location.href = "../profile/myposts.html";
});

logoutBtn.addEventListener("click", async () => {
  try {
    await logout();
  } catch (error) {
    messageEl.textContent = error.message || "Đăng xuất thất bại.";
  }
});



loadProfile();
loadMyPosts();
