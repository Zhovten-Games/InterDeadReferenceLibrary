import { ScenePlayer } from './scene-player.js';

function resolvePayloadUri() {
  const params = new URLSearchParams(window.location.search);
  return params.get('payload');
}

function resolveFrameworkUri() {
  const params = new URLSearchParams(window.location.search);
  return params.get('framework');
}

async function loadFrameworkBundle(frameworkUri) {
  if (!frameworkUri) {
    throw new Error('Framework bundle URL is required. Provide ?framework=... in scene URL.');
  }

  if (globalThis.InterdeadFramework) {
    return;
  }

  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = frameworkUri;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load framework bundle: ${frameworkUri}`));
    document.head.appendChild(script);
  });
}

async function bootstrap() {
  const frameworkUri = resolveFrameworkUri();
  await loadFrameworkBundle(frameworkUri);

  window.scenePlayer = new ScenePlayer();
  const payloadUri = resolvePayloadUri();
  if (!payloadUri) {
    throw new Error('Payload URI is required. Provide ?payload=... in scene URL.');
  }

  await window.scenePlayer.loadPayload(payloadUri);

  const mode = new URLSearchParams(window.location.search).get('mode');
  if (mode === 'preview') {
    await window.scenePlayer.startPreviewPlayback();
  }
}

bootstrap().catch((error) => {
  console.error(`[SceneBootstrap] Failed to initialize scene: ${error?.message ?? 'unknown error'}`);
});
