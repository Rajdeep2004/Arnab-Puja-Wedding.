const $ = (s) => document.querySelector(s);

async function loadEvents() {
  try {
    const response = await fetch("/api/events");
    const events = await response.json();
    const mapLink = $("#mapsLink");
    if (events.mapsUrl && mapLink) mapLink.href = events.mapsUrl;
    if (events.videoUrl) {
      const shell = $("#videoShell");
      const note = $("#videoNote");
      if (/youtube\.com|youtu\.be/.test(events.videoUrl)) {
        let id = "";
        try {
          const u = new URL(events.videoUrl);
          id = u.hostname.includes("youtu.be") ? u.pathname.slice(1) : (u.searchParams.get("v") || u.pathname.split("/").filter(Boolean).pop());
        } catch (_) {}
        if (id) {
          shell.querySelector(".video-poster").outerHTML = `<iframe class="video-player" src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}" title="Arnab and Puja wedding invitation film" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
          note.textContent = "Watch the wedding invitation film. Share this page with family and friends.";
        }
      } else if (/^https?:\/\//i.test(events.videoUrl)) {
        shell.querySelector(".video-poster").outerHTML = `<video class="video-player" controls playsinline preload="metadata" poster="/images/invitation-poster.svg"><source src="${events.videoUrl.replace(/"/g, "&quot;")}" type="video/mp4">Your browser does not support video playback.</video>`;
        note.textContent = "Watch the wedding invitation film. Share this page with family and friends.";
      }
    }
  } catch (e) {
    console.warn("Using default invitation settings.", e);
  }
}

function shareInvitation() {
  const data = {
    title: "Arnab ♥ Puja — Wedding Invitation",
    text: "With love, we invite you to celebrate Arnab & Puja. Wedding: 21 November 2026, 6:30 PM. Reception: 23 November 2026, 6:30 PM. Venue: Palashan (Sain Para), Purba Bardhaman, West Bengal 713424.",
    url: window.location.href
  };
  if (navigator.share) {
    navigator.share(data).catch(() => {});
  } else if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(`${data.text}\n${data.url}`).then(() => alert("Invitation link and message copied. Share them on WhatsApp!")).catch(() => window.prompt("Copy your invitation link:", window.location.href));
  } else {
    window.prompt("Copy your invitation link:", window.location.href);
  }
}
$("#shareTop").addEventListener("click", shareInvitation);
$("#shareBottom").addEventListener("click", shareInvitation);
$("#menuToggle").addEventListener("click", () => $(".nav-links").classList.toggle("open"));
document.querySelectorAll(".nav-links a").forEach(a => a.addEventListener("click", () => $(".nav-links").classList.remove("open")));

$("#videoPlay").addEventListener("click", () => {
  const note = $("#videoNote");
  note.textContent = "To play your real wedding film here, add its hosted video URL as WEDDING_VIDEO_URL in your hosting environment and redeploy.";
  note.scrollIntoView({ behavior: "smooth", block: "center" });
});

const weddingDate = new Date("2026-11-21T18:30:00+05:30");
function updateCountdown() {
  let diff = Math.max(0, weddingDate.getTime() - Date.now());
  const d = Math.floor(diff / 86400000); diff %= 86400000;
  const h = Math.floor(diff / 3600000); diff %= 3600000;
  const m = Math.floor(diff / 60000); diff %= 60000;
  const s = Math.floor(diff / 1000);
  $("#days").textContent = String(d).padStart(2, "0");
  $("#hours").textContent = String(h).padStart(2, "0");
  $("#minutes").textContent = String(m).padStart(2, "0");
  $("#seconds").textContent = String(s).padStart(2, "0");
}
updateCountdown();
setInterval(updateCountdown, 1000);

$("#rsvpForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const status = $("#rsvpStatus");
  const button = form.querySelector('button[type="submit"]');
  const data = Object.fromEntries(new FormData(form).entries());
  data.guests = Number(data.guests);
  button.disabled = true;
  button.textContent = "Sending…";
  status.textContent = "";
  try {
    const response = await fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not submit your RSVP.");
    status.textContent = result.message;
    form.reset();
  } catch (error) {
    status.textContent = error.message || "Network error. Please try again.";
  } finally {
    button.disabled = false;
    button.innerHTML = "Send my response ♥";
  }
});

loadEvents();
