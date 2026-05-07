const BASE_URL = "http://localhost:8000";

function decodeJwtPayload(token) {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid token format");
  }

  const base64Url = parts[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const json = atob(padded);
  return JSON.parse(json);
}

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const messageEl = document.getElementById("message");
  const loginPath = "./login";

  try {
    const apiUrl = `${BASE_URL}/login`;

    console.log("Calling API:", loginPath, "=>", apiUrl, { username });

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      messageEl.textContent = data.message || "Đăng nhập thất bại";
      messageEl.style.color = "red";
      return;
    }

    const accessToken = data?.data?.access_token;
    if (accessToken) {
      localStorage.setItem("access_token", accessToken);

      const payload = decodeJwtPayload(accessToken);
      const role = payload?.data?.role;

      if (role === "user") {
        window.location.href = "../post/post.html";
        return;
      }

      if (role === "admin") {
        window.location.href = "../admin/admin.html";
        return;
      }
    }

    messageEl.textContent = data.message || "Đăng nhập thành công";
    messageEl.style.color = "green";
  } catch (error) {
    messageEl.textContent = "Không thể kết nối server";
    messageEl.style.color = "red";
  }
});
