import { tOrFallback } from '../../../i18n/fallbackText.js';

const loadShareImage = (src) => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = reject;
  image.src = src;
});

export const createMasterShareFile = async ({ characterImage, nickname, hanjaCount, completedDate, t }) => {
  if (typeof document === 'undefined' || typeof File === 'undefined') return null;
  await document.fonts?.ready;
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const background = ctx.createLinearGradient(0, 0, 1080, 1080);
  background.addColorStop(0, '#292A63');
  background.addColorStop(0.52, '#5861C6');
  background.addColorStop(1, '#2C285D');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, 1080, 1080);

  const glow = ctx.createRadialGradient(540, 260, 10, 540, 260, 360);
  glow.addColorStop(0, 'rgba(255,220,112,0.42)');
  glow.addColorStop(1, 'rgba(255,220,112,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 1080, 600);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFE39A';
  ctx.font = '600 30px SUIT, sans-serif';
  ctx.letterSpacing = '8px';
  ctx.fillText('HANJAPOP GRAND FINALE', 540, 75);
  ctx.letterSpacing = '0px';

  try {
    const character = await loadShareImage(characterImage);
    const ratio = Math.min(280 / character.width, 280 / character.height);
    const width = character.width * ratio;
    const height = character.height * ratio;
    ctx.drawImage(character, 540 - width / 2, 48 + (280 - height) / 2, width, height);
  } catch {
    // 이미지 로딩에 실패해도 인증서 텍스트는 공유한다.
  }

  ctx.fillStyle = 'rgba(255,255,255,0.78)';
  ctx.font = '500 36px SUIT, sans-serif';
  ctx.fillText(tOrFallback(t, 'ext_2178'), 540, 370);
  ctx.fillStyle = '#FFF0A7';
  ctx.font = '700 68px GmarketSans, SUIT, sans-serif';
  ctx.fillText(tOrFallback(t, 'ext_1815'), 540, 450);

  ctx.fillStyle = 'rgba(255,255,255,0.13)';
  ctx.strokeStyle = 'rgba(255,255,255,0.38)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(90, 500, 900, 400, 46);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FFE39A';
  ctx.font = '600 28px SUIT, sans-serif';
  ctx.fillText(tOrFallback(t, 'ext_1862'), 540, 565);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 62px GmarketSans, SUIT, sans-serif';
  ctx.fillText(nickname || tOrFallback(t, 'ext_980'), 540, 645);

  const statX = [285, 540, 795];
  const statValues = ['124', String(hanjaCount), '100%'];
  const statLabels = [tOrFallback(t, 'ext_478'), tOrFallback(t, 'ext_479'), tOrFallback(t, 'ext_480')];
  statX.forEach((x, index) => {
    ctx.fillStyle = '#FFF0A7';
    ctx.font = '700 50px SUIT, sans-serif';
    ctx.fillText(statValues[index], x, 755);
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.font = '400 25px SUIT, sans-serif';
    ctx.fillText(statLabels[index], x, 798);
  });

  ctx.fillStyle = 'rgba(255,255,255,0.58)';
  ctx.font = '400 25px SUIT, sans-serif';
  ctx.fillText(`${completedDate} · HANJAPOP`, 540, 865);

  ctx.fillStyle = '#FFE39A';
  ctx.font = '600 34px SUIT, sans-serif';
  ctx.fillText(tOrFallback(t, 'ext_2052'), 540, 980);
  ctx.fillStyle = 'rgba(255,255,255,0.68)';
  ctx.font = '400 25px SUIT, sans-serif';
  ctx.fillText(tOrFallback(t, 'ext_2315'), 540, 1028);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 0.95));
  return blob ? new File([blob], 'hanjapop-master.png', { type: 'image/png' }) : null;
};
