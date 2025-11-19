// public/js/dashboard.js
// Dashboard frontend: create, list, delete links + client-side search/filter

const form = document.getElementById("add-link-form");
const targetUrlInput = document.getElementById("targetUrl");
const customCodeInput = document.getElementById("customCode");
const messageEl = document.getElementById("form-message");
const tbody = document.getElementById("linksTableBody");
const searchInput = document.getElementById("searchInput");

// In-memory cache of loaded links
let allLinks = [];

// ---------- Helpers ----------
function truncate(str, n = 60) {
  if (!str) return "";
  return str.length > n ? str.slice(0, n - 1) + "…" : str;
}

function showMessage(text, ok = true) {
  messageEl.textContent = text;
  messageEl.style.color = ok ? "green" : "red";
  setTimeout(() => {
    // clear after 3s
    if (messageEl.textContent === text) messageEl.textContent = "";
  }, 3000);
}

// ---------- Submit handler ----------
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const targetUrl = targetUrlInput.value.trim();
  const code = customCodeInput.value.trim() || null;
  const submitBtn = form.querySelector('button[type="submit"]');

  if (!targetUrl) {
    showMessage("Please enter a URL", false);
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Creating...";

  try {
    const res = await fetch("/api/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUrl, code }),
    });

    const data = await res.json();

    if (res.status === 201) {
      showMessage("Short link created");
      targetUrlInput.value = "";
      customCodeInput.value = "";

      // Add created link to cache and re-render (so search state remains)
      allLinks.unshift({
        code: data.code,
        targetUrl: data.targetUrl,
        clicks: data.clicks,
        createdAt: data.createdAt,
        lastClicked: data.lastClicked,
      });
      renderTable(allLinks);
    } else {
      showMessage(data.error || "Failed to create link", false);
    }
  } catch (err) {
    console.error(err);
    showMessage("Network/server error", false);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Create Short Link";
  }
});

// ---------- Load links from server ----------
async function loadLinks() {
  try {
    const res = await fetch("/api/links");
    if (!res.ok) {
      const text = await res.text();
      console.error("/api/links error:", res.status, text);
      tbody.innerHTML = `<tr><td colspan="5">Failed to load links (status ${res.status})</td></tr>`;
      return;
    }

    const links = await res.json();
    allLinks = Array.isArray(links) ? links : [];
    renderTable(allLinks);
  } catch (err) {
    console.error("Failed to load links:", err);
    tbody.innerHTML = `<tr><td colspan="5">Network error while loading links</td></tr>`;
  }
}

// ---------- Render table with given array ----------
function renderTable(list) {
  if (!list || list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state">No links yet — create your first short link.</td></tr>`;
    return;
  }

  tbody.innerHTML = "";
  list.forEach((link) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="short"><a href="/${link.code}" target="_blank" rel="noopener">${window.location.origin}/${link.code}</a>
        <div class="small">/${link.code}</div>
      </td>
      <td title="${link.targetUrl}">${truncate(link.targetUrl, 80)}</td>
      <td>${link.clicks}</td>
      <td>${link.lastClicked ? new Date(link.lastClicked).toLocaleString() : "-"}</td>
      <td class="actions">
        <div class="action-row">
          <button class="icon-btn" data-copy="${link.code}">Copy</button>
          <button class="icon-btn" onclick="confirmDelete('${link.code}')">Delete</button>
            <a class="icon-btn" href="/code/${link.code}">Stats</a>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ---------- Delete helpers ----------
window.confirmDelete = async function (code) {
  if (!confirm("Delete this link?")) return;
  try {
    const res = await fetch(`/api/links/${code}`, { method: "DELETE" });
    if (res.status === 204) {
      // remove from cache and re-render (preserve current filter)
      allLinks = allLinks.filter((l) => l.code !== code);
      applyFilter(); // re-render filtered view
    } else {
      const d = await res.json();
      alert(d.error || "Failed to delete");
    }
  } catch (err) {
    console.error(err);
    alert("Network error while deleting");
  }
};

// ---------- Copy-to-clipboard (small UX bonus) ----------
document.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-copy]");
  if (!btn) return;
  const code = btn.getAttribute("data-copy");
  const text = `${window.location.origin}/${code}`;
  navigator.clipboard
    .writeText(text)
    .then(() => {
      btn.classList.add("copied");
      btn.textContent = "Copied";
      setTimeout(() => {
        btn.classList.remove("copied");
        btn.textContent = "Copy";
      }, 1500);
    })
    .catch((err) => {
      console.error("Copy failed", err);
      alert("Copy failed");
    });
});

// ---------- Search / Filter logic ----------
// Debounce to avoid excessive renders while typing
function debounce(fn, wait = 200) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

function applyFilter() {
  const q = (searchInput.value || "").trim().toLowerCase();
  if (!q) {
    renderTable(allLinks);
    return;
  }

  const filtered = allLinks.filter((l) => {
    return (
      (l.code && l.code.toLowerCase().includes(q)) ||
      (l.targetUrl && l.targetUrl.toLowerCase().includes(q))
    );
  });

  renderTable(filtered);
}

const debouncedFilter = debounce(applyFilter, 200);
searchInput.addEventListener("input", debouncedFilter);

// ---------- Initial load ----------
loadLinks();
