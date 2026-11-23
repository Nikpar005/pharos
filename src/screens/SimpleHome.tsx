import { useRef, useState } from 'preact/hooks';
import { useStore } from '../store';
import { Icon } from '../components/Icon';
import { href } from '../router';

/**
 * Simple mode for older relatives: only the two actions that matter.
 * Leaving it needs a 2-second press so it can't happen by accident.
 */
export function SimpleHome() {
  const { t, country, setSettings } = useStore();
  const timer = useRef(0);
  const [holding, setHolding] = useState(false);

  const start = () => {
    setHolding(true);
    timer.current = window.setTimeout(() => setSettings({ simpleMode: false }), 2000);
  };
  const cancel = () => {
    setHolding(false);
    clearTimeout(timer.current);
  };

  return (
    <div class="simple">
      <a class="simple-btn big-danger" href={`tel:${country.emergency}`}>
        <Icon name="phone" size={56} />
        <span>{t('home.call')}</span>
      </a>
      <a class="simple-btn big-safe" href={href('ok')}>
        <Icon name="checkCircle" size={56} />
        <span>{t('home.ok')}</span>
      </a>
      <button
        class={holding ? 'simple-exit holding' : 'simple-exit'}
        onPointerDown={start}
        onPointerUp={cancel}
        onPointerLeave={cancel}
        onPointerCancel={cancel}
        onKeyDown={(e) => e.key === 'Enter' && setSettings({ simpleMode: false })}
      >
        {t('simple.exit')}
      </button>
    </div>
  );
}
