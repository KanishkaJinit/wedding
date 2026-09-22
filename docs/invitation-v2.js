const pages = [...document.querySelectorAll('.page')];
const controls = document.getElementById('pageControls');
const status = document.getElementById('pageStatus');
const prev = document.getElementById('prevPage');
const next = document.getElementById('nextPage');
const toast = document.getElementById('toast');
const weddingAudio = document.getElementById('weddingAudio');
const musicButton = document.getElementById('musicButton');
let current = 0;
let toastTimer;
let lastPageChange = 0;

async function playMusic() {
  try {
    weddingAudio.volume = 0.82;
    await weddingAudio.play();
    musicButton.classList.add('is-playing');
    musicButton.setAttribute('aria-label', 'Pause wedding music');
    musicButton.setAttribute('aria-pressed', 'true');
  } catch (error) {
    musicButton.classList.remove('is-playing');
    musicButton.setAttribute('aria-label', 'Play wedding music');
    musicButton.setAttribute('aria-pressed', 'false');
    announce('Tap the music button to play the song');
  }
}

function pauseMusic() {
  weddingAudio.pause();
  musicButton.classList.remove('is-playing');
  musicButton.setAttribute('aria-label', 'Play wedding music');
  musicButton.setAttribute('aria-pressed', 'false');
}

function showPage(index) {
  const target = Math.max(0, Math.min(pages.length - 1, index));
  pages.forEach((page, i) => {
    page.classList.toggle('active', i === target);
    page.inert = i !== target;
    if (i === target) page.scrollTop = 0;
  });
  current = target;
  lastPageChange = Date.now();
  controls.hidden = current === 0;
  status.textContent = `${current + 1} / ${pages.length}`;
  prev.disabled = current <= 1;
  next.disabled = current === pages.length - 1;
  document.title = `${current === 0 ? 'Open your invitation' : pages[current].getAttribute('aria-label')} | Kanishka & Jinit`;
  if (current === pages.length - 1 && window.location.hash !== '#rsvp') history.replaceState(null, '', '#rsvp');
}

const envelope = document.getElementById('envelope-page');
document.getElementById('openInvitation').addEventListener('click', () => {
  if (envelope.classList.contains('unsealing')) return;
  envelope.classList.add('unsealing');
  window.setTimeout(() => showPage(1), matchMedia('(prefers-reduced-motion: reduce)').matches ? 100 : 1450);
});
document.getElementById('openInvitation').addEventListener('pointerdown', playMusic);
document.getElementById('openInvitation').addEventListener('touchstart', playMusic, { passive: true });
document.getElementById('rsvpLink').addEventListener('click', () => showPage(pages.length - 1));
prev.addEventListener('click', () => showPage(current - 1));
next.addEventListener('click', () => showPage(current + 1));
musicButton.addEventListener('click', () => {
  if (weddingAudio.paused) playMusic();
  else pauseMusic();
});
document.addEventListener('keydown', event => {
  if (event.key === 'ArrowRight' && current > 0) showPage(current + 1);
  if (event.key === 'ArrowLeft' && current > 1) showPage(current - 1);
});

let touchStartX = 0;
let touchStartY = 0;
let touchStartedAtTop = false;
let touchStartedAtBottom = false;
const phone = document.getElementById('phone');
phone.addEventListener('touchstart', event => {
  touchStartX = event.changedTouches[0].screenX;
  touchStartY = event.changedTouches[0].screenY;
  const page = pages[current];
  touchStartedAtTop = page.scrollTop <= 2;
  touchStartedAtBottom = page.scrollTop + page.clientHeight >= page.scrollHeight - 2;
}, { passive: true });
phone.addEventListener('touchend', event => {
  if (current === 0) return;
  const dx = event.changedTouches[0].screenX - touchStartX;
  const dy = event.changedTouches[0].screenY - touchStartY;
  if (current === 1 && dy < -35 && Math.abs(dy) > Math.abs(dx) * 1.1) {
    showPage(current + 1);
    return;
  }
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4) {
    showPage(current + (dx < 0 ? 1 : -1));
  } else if (Math.abs(dy) > 70 && Math.abs(dy) > Math.abs(dx) * 1.3) {
    if (dy < 0 && touchStartedAtBottom) showPage(current + 1);
    if (dy > 0 && touchStartedAtTop && current > 1) showPage(current - 1);
  }
}, { passive: true });

let boundaryWheel = 0;
document.addEventListener('wheel', event => {
  if (current === 0 || Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
  const page = pages[current];
  const goingForward = event.deltaY > 0;
  if (current === 1 && goingForward && Date.now() - lastPageChange >= 650) {
    event.preventDefault();
    showPage(current + 1);
    return;
  }
  const atBoundary = goingForward
    ? page.scrollTop + page.clientHeight >= page.scrollHeight - 3
    : page.scrollTop <= 3;
  if (!atBoundary) { boundaryWheel = 0; return; }
  if ((!goingForward && current <= 1) || (goingForward && current >= pages.length - 1)) return;
  event.preventDefault();
  if (Date.now() - lastPageChange < 650) return;
  boundaryWheel += event.deltaY;
  if (Math.abs(boundaryWheel) >= 35) {
    showPage(current + (goingForward ? 1 : -1));
    boundaryWheel = 0;
  }
}, { passive: false });

function updateCountdown() {
  const difference = Math.max(0, new Date('2026-12-06T16:00:00+11:00').getTime() - Date.now());
  const values = {
    days: Math.floor(difference / 86400000),
    hours: Math.floor(difference / 3600000) % 24,
    minutes: Math.floor(difference / 60000) % 60,
    seconds: Math.floor(difference / 1000) % 60
  };
  for (const [id, value] of Object.entries(values)) document.getElementById(id).textContent = String(value).padStart(2, '0');
}
updateCountdown();
setInterval(updateCountdown, 1000);

if (window.location.hash.toLowerCase() === '#rsvp') showPage(pages.length - 1);

function announce(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
}

const rsvpForm = document.getElementById('rsvpForm');
const rsvpThanks = document.getElementById('rsvpThanks');
rsvpForm.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(rsvpForm);
  const fullName = data.get('fullName').trim();
  const attendance = data.get('attendance');
  const adults = data.get('adults') || '0';
  const children = data.get('children') || '0';
  const body = [
    'RSVP RECEIVED',
    '',
    `Full Name: ${fullName}`,
    `Attendance: ${attendance}`,
    `Guests attending: ${adults} adult(s), ${children} child/children`,
    '',
    `Names of everyone attending:`,
    data.get('guestNames').trim(),
    '',
    `Children's ages:`,
    data.get('childrenAges').trim() || 'None',
    '',
    `Dietary requirements or allergies:`,
    data.get('dietary').trim(),
    '',
    `Anything else we should know:`,
    data.get('extraInfo').trim() || 'None',
    '',
    `Note for the bride & groom:`,
    data.get('note').trim() || 'None',
    '',
    'With love,',
    'Kanishka & Jinit 06.12.2026'
  ].join('\n');
  const subject = `Wedding RSVP - ${fullName}`;
  const mailto = `mailto:kanishka.desai4@gmail.com,jinitrabari@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  rsvpThanks.hidden = false;
  rsvpForm.hidden = true;
  announce('Your email app is opening with the RSVP');
  window.location.href = mailto;
});
document.getElementById('shareButton').addEventListener('click', async () => {
  const data = { title: 'Kanishka & Jinit Wedding Invitation', text: 'Join us on 6 December 2026.', url: location.href.split('#')[0] };
  try {
    if (navigator.share) await navigator.share(data);
    else if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(data.url); announce('Invitation link copied'); }
    else announce('Copy the page address to share this invitation');
  } catch (error) { if (error.name !== 'AbortError') announce('Copy the page address to share this invitation'); }
});

showPage(0);
