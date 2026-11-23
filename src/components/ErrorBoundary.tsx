import { Component, type ComponentChildren } from 'preact';

/**
 * If any screen crashes, show a calm fallback with 112 instead of a blank
 * page. Text is in Greek and English because the app state may be broken.
 */
export class ErrorBoundary extends Component<{ children: ComponentChildren }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Pharos screen error', error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div class="fallback" role="alert">
        <a class="big-action big-danger" href="tel:112">
          <span class="big-text">
            <span class="big-title">112</span>
            <span class="big-sub">Κλήση έκτακτης ανάγκης · Emergency call</span>
          </span>
        </a>
        <p>Κάτι πήγε στραβά σε αυτή την οθόνη. · Something went wrong on this screen.</p>
        <a
          class="btn btn-primary"
          href="#/"
          onClick={() => {
            this.setState({ failed: false });
          }}
        >
          Αρχική · Home
        </a>
        <button class="btn btn-ghost" onClick={() => location.reload()}>
          Επαναφόρτωση · Reload
        </button>
      </div>
    );
  }
}
