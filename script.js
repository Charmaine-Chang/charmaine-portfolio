const video = document.querySelector('#source-video');
const figure = document.querySelector('.figure');
const fallback = document.querySelector('.video-fallback');
const playButton = document.querySelector('.video-play');
const profile = document.querySelector('.profile');
const world = document.querySelector('.world');
const worldVideo = document.querySelector('#world-video');
let animationFrame;
let profileShown = false;

function syncProfile() {
  const inWave = video.currentTime >= 2.35;
  if (inWave && !profileShown) {
    profile.classList.add('is-visible');
    profileShown = true;
  } else if (video.currentTime < 0.35 && profileShown) {
    profile.classList.remove('is-visible');
    profileShown = false;
  }
  animationFrame = requestAnimationFrame(syncProfile);
}

function initialiseVideo() {
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.play().then(() => { playButton.hidden = true; }).catch(() => { playButton.hidden = false; });
}
video.addEventListener('loadedmetadata', initialiseVideo);
video.addEventListener('play', () => { playButton.hidden = true; cancelAnimationFrame(animationFrame); syncProfile(); figure.classList.add('playing'); });
video.addEventListener('pause', () => { if (!document.hidden) playButton.hidden = false; });
video.addEventListener('error', () => fallback.style.display = 'block');
document.addEventListener('visibilitychange', () => document.hidden ? cancelAnimationFrame(animationFrame) : syncProfile());
playButton.addEventListener('click', () => video.play());
window.addEventListener('pageshow', () => video.play().catch(() => { playButton.hidden = false; }));
document.addEventListener('pointerdown', () => { if (video.paused) video.play().catch(() => {}); }, { once: true });
if (video.readyState >= 1) initialiseVideo();

let worldDuration = 0;
let targetWorldTime = 0;
let displayedWorldTime = 0;

function initialiseWorldVideo() {
  worldDuration = Math.max(0, worldVideo.duration - 0.04);
  worldVideo.pause();
  worldVideo.currentTime = 0;
}
worldVideo.addEventListener('loadedmetadata', initialiseWorldVideo);
if (worldVideo.readyState >= 1) initialiseWorldVideo();

function setWorldTarget(clientX) {
  if (!worldDuration) return;
  const bounds = world.getBoundingClientRect();
  const pointer = Math.min(1, Math.max(0, (clientX - bounds.left) / bounds.width));
  targetWorldTime = pointer * worldDuration;
  world.style.setProperty('--scrub', pointer.toFixed(3));
}

world.addEventListener('pointermove', event => setWorldTarget(event.clientX));
world.addEventListener('pointerdown', event => setWorldTarget(event.clientX));

function smoothWorldVideo() {
  if (worldDuration && worldVideo.readyState >= 2) {
    displayedWorldTime += (targetWorldTime - displayedWorldTime) * 0.18;
    if (Math.abs(worldVideo.currentTime - displayedWorldTime) > 0.012) {
      worldVideo.currentTime = Math.min(worldDuration, Math.max(0, displayedWorldTime));
    }
  }
}
window.setInterval(smoothWorldVideo, 33);

const stackedSections = [...document.querySelectorAll('.section')];
let surfaceTicking = false;

function updateSectionSurfaces() {
  const viewportHeight = window.innerHeight || 1;
  stackedSections.forEach(section => {
    const top = section.getBoundingClientRect().top;
    const progress = Math.min(1, Math.max(0, 1 - top / viewportHeight));
    const alpha = 0.38 + progress * 0.62;
    section.style.setProperty('--surface-alpha', alpha.toFixed(3));
  });
  surfaceTicking = false;
}

window.addEventListener('scroll', () => {
  if (!surfaceTicking) {
    requestAnimationFrame(updateSectionSurfaces);
    surfaceTicking = true;
  }
}, { passive: true });
window.addEventListener('resize', updateSectionSurfaces);
updateSectionSurfaces();
