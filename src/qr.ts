import QRCode from 'qrcode';
import { t } from './i18n';
import { store } from './state';

const AUTO_DISMISS_MS = 30_000;

interface OpenOpts {
  url: string;
}

let openModal: HTMLDivElement | null = null;
let dismissTimer: number | undefined;

export function showQrModal({ url }: OpenOpts): void {
  closeQrModal();

  const dict = t(store.get().lang);

  const root = document.createElement('div');
  root.className = 'qr-modal';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');

  const backdrop = document.createElement('div');
  backdrop.className = 'qr-modal__backdrop';
  backdrop.addEventListener('click', closeQrModal);

  const card = document.createElement('div');
  card.className = 'qr-modal__card';
  card.addEventListener('click', (e) => e.stopPropagation());

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'qr-modal__close';
  closeBtn.setAttribute('aria-label', dict.qr.close);
  closeBtn.innerHTML = '×';
  closeBtn.addEventListener('click', closeQrModal);

  const title = document.createElement('div');
  title.className = 'qr-modal__title';
  title.textContent = dict.qr.title;

  const qrWrap = document.createElement('div');
  qrWrap.className = 'qr-modal__code';

  const canvas = document.createElement('canvas');
  qrWrap.appendChild(canvas);

  const subtitle = document.createElement('div');
  subtitle.className = 'qr-modal__subtitle';
  subtitle.textContent = dict.qr.subtitle;

  const urlText = document.createElement('div');
  urlText.className = 'qr-modal__url';
  urlText.textContent = url;

  card.append(closeBtn, title, qrWrap, subtitle, urlText);
  root.append(backdrop, card);
  document.body.appendChild(root);

  void QRCode.toCanvas(canvas, url, {
    width: 320,
    margin: 1,
    color: { dark: '#1a1614', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  });

  // Animate in next frame
  requestAnimationFrame(() => root.classList.add('qr-modal--open'));

  openModal = root;
  dismissTimer = window.setTimeout(closeQrModal, AUTO_DISMISS_MS);
}

export function closeQrModal(): void {
  if (!openModal) return;
  if (dismissTimer !== undefined) {
    window.clearTimeout(dismissTimer);
    dismissTimer = undefined;
  }
  const node = openModal;
  openModal = null;
  node.classList.remove('qr-modal--open');
  window.setTimeout(() => node.remove(), 360);
}
