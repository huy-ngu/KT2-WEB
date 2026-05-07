const BASE_URL = "http://localhost:8000";

const userIdEl = document.getElementById("userId");
const usernameEl = document.getElementById("username");
const roleEl = document.getElementById("role");
const messageEl = document.getElementById("message");
const backBtn = document.getElementById("backBtn");
const myPostsBtn = document.getElementById("myPostsBtn");
const changePasswordBtn = document.getElementById("changePasswordBtn");
const logoutBtn = document.getElementById("logoutBtn");

// Modal elements
const modal = document.getElementById("changePasswordModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const changePasswordForm = document.getElementById("changePasswordForm");
const oldPasswordInput = document.getElementById("oldPassword");
const newPasswordInput = document.getElementById("newPassword");
const modalMessageEl = document.getElementById("modalMessage");

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

function redirectToLogin(message = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.") {
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
    redirectToLogin("Vui lòng đăng nhập lại.");
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

function renderProfile(profile) {
  userIdEl.textContent = profile?.id ?? "-";
  usernameEl.textContent = profile?.username ?? "-";
  roleEl.textContent = profile?.role ?? "-";
}

async function loadProfile() {
  const token = getAccessTokenOrRedirect();
  if (!token) return;

  messageEl.textContent = "";

  try {
    const res = await fetch(`${BASE_URL}/profile`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const payload = await res.json().catch(() => ({}));
    if (handleAuthExpiredResponse(res)) return;
    if (!res.ok) {
      messageEl.textContent = payload.message || "Không thể tải được profile.";
      return;
    }

    renderProfile(payload);
  } catch (error) {
    messageEl.textContent = "Không thể kết nối server.";
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

// Modal Logic
changePasswordBtn.addEventListener("click", () => {
  modal.style.display = "block";
  modalMessageEl.textContent = "";
  modalMessageEl.className = "modal-message";
  changePasswordForm.reset();
});

closeModalBtn.addEventListener("click", () => {
  modal.style.display = "none";
});

window.addEventListener("click", (event) => {
  if (event.target == modal) {
    modal.style.display = "none";
  }
});

changePasswordForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const token = getAccessTokenOrRedirect();
  if (!token) return;

  const oldPassword = oldPasswordInput.value;
  const newPassword = newPasswordInput.value;

  if (!oldPassword || !newPassword) {
    modalMessageEl.textContent = "Vui lòng nhập đầy đủ thông tin.";
    modalMessageEl.className = "modal-message";
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/change-password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        old_password: oldPassword,
        new_password: newPassword,
      }),
    });

    const payload = await res.json().catch(() => ({}));
    if (handleAuthExpiredResponse(res)) return;

    if (!res.ok) {
      modalMessageEl.textContent = payload.message || "Đổi mật khẩu thất bại.";
      modalMessageEl.className = "modal-message";
      return;
    }

    modalMessageEl.textContent = "Đổi mật khẩu thành công!";
    modalMessageEl.className = "modal-message success";
    
    // Tự đóng modal sau 1.5s
    setTimeout(() => {
      modal.style.display = "none";
    }, 1500);

  } catch (error) {
    modalMessageEl.textContent = "Không thể kết nối server.";
    modalMessageEl.className = "modal-message";
  }
});

loadProfile();
