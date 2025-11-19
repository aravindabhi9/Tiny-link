// code.js - load stats for a single link

// Get the code from the URL
const code = window.location.pathname.split("/").pop();

// Fetch details
async function loadStats() {
  const res = await fetch(`/api/links/${code}`);

  if (!res.ok) {
    document.body.innerHTML = "<h2>Link not found</h2>";
    return;
  }

  const data = await res.json();

  document.getElementById("code").textContent = data.code;
  document.getElementById("targetUrl").textContent = data.targetUrl;
  document.getElementById("targetUrl").href = data.targetUrl;
  document.getElementById("clicks").textContent = data.clicks;
  document.getElementById("lastClicked").textContent =
    data.lastClicked || "-";
  document.getElementById("createdAt").textContent = data.createdAt;
}

loadStats();
