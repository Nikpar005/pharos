import { Screen, BackLink, CallButton } from '../components/ui';

export function NotFound() {
  return (
    <Screen tab="home">
      <BackLink />
      <h1 class="title-l">404</h1>
      <CallButton />
    </Screen>
  );
}
