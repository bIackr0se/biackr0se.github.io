// Minimal JS — random glitch pulse on the ASCII banner
(function () {
  const banner = document.querySelector('.ascii-banner pre');
  if (!banner) return;

  const original = banner.textContent;

  function corruptChar(c) {
    if (c === ' ' || c === '\n') return c;
    const glitchChars = '░▒▓█▀▄▌▐│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌';
    return Math.random() > 0.7 ? glitchChars[Math.floor(Math.random() * glitchChars.length)] : c;
  }

  function glitchPulse() {
    const chars = original.split('');
    const corrupted = chars.map(c => corruptChar(c)).join('');
    banner.textContent = corrupted;
    setTimeout(() => { banner.textContent = original; }, 80);
  }

  // Random glitch every 4-10 seconds
  function scheduleGlitch() {
    const delay = 4000 + Math.random() * 6000;
    setTimeout(() => {
      glitchPulse();
      scheduleGlitch();
    }, delay);
  }

  scheduleGlitch();
})();
