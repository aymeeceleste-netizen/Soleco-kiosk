import heatpumpUrl from '../assets/soleco-heatpump.png';
import { t } from '../i18n';
import { store } from '../state';
import type { ModeView } from './_types';

/**
 * Placeholder mode for slots not yet implemented. Mounts the photo
 * centered and shows a "Coming soon" caption.
 */
export function mountStub(): ModeView {
  const hero = document.createElement('div');
  hero.className = 'stub-hero';

  const stage = document.createElement('div');
  stage.className = 'stub-stage';
  const photo = document.createElement('img');
  photo.src = heatpumpUrl;
  photo.alt = '';
  photo.className = 'stub-photo';
  stage.appendChild(photo);
  hero.appendChild(stage);

  const caption = document.createElement('div');
  caption.className = 'mode-caption';

  const control = document.createElement('div');
  control.className = 'mode-control';
  const label = document.createElement('span');
  label.className = 'control__placeholder';
  control.appendChild(label);

  const render = () => {
    const dict = t(store.get().lang);
    caption.textContent = dict.comingSoon;
    label.textContent = dict.shellPlaceholderControl;
  };
  const unsub = store.subscribe(render);
  render();

  return {
    hero,
    caption,
    control,
    destroy() {
      unsub();
    },
  };
}
