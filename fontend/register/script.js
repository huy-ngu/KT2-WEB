async function loadBaseUrl() {
  const res = await fetch("/.env", { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Cannot load .env file");
  }

  const text = await res.text();
  const lines = text.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const [key, ...rest] = line.split("=");
    if (key === "BASE_URL") {
      return rest.join("=").trim();
    }
  }

  throw new Error("BASE_URL is missing in .env");
}

document
  .getElementById("registerForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const messageEl = document.getElementById("message");

    try {
      const baseUrl = await loadBaseUrl();
      const res = await fetch(`${baseUrl}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        messageEl.textContent = data.message || "Đăng ký thất bại";
        messageEl.style.color = "red";
        return;
      }

      messageEl.textContent = data.message || "Đăng ký thành công";
      messageEl.style.color = "green";
    } catch (error) {
      messageEl.textContent = "Không thể kết nối server";
      messageEl.style.color = "red";
    }
  });
