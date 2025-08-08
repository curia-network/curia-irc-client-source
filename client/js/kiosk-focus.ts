import {store} from "./store";
import {router} from "./router";
import socket from "./socket";

function normalizeChannelName(s: string): string {
  try { s = decodeURIComponent(s); } catch {}
  s = (s || "").trim().toLowerCase();
  if (s.startsWith('#') || s.startsWith('&') || s.startsWith('+')) s = s.slice(1);
  return s;
}

function waitUntil(cond: () => boolean): Promise<void> {
  return new Promise((resolve) => {
    const id = setInterval(() => {
      if (cond()) { clearInterval(id); resolve(); }
    }, 100);
  });
}

(async function setupKioskSingleChannel() {
  const mode = document.body.getAttribute('data-curia-mode');
  const focusRaw = document.body.getAttribute('data-curia-focus');
  if (mode !== 'single' || !focusRaw) return;

  const wanted = normalizeChannelName(focusRaw);

  // Wait until networks and channels are available
  await waitUntil(() => store.state.appLoaded && (store.state.networks?.length || 0) > 0);

  const findLobbyId = (): number | null => {
    for (const net of store.state.networks) {
      const lobby = (net.channels || []).find((c: any) => c.type === 'lobby');
      if (lobby) return Number(lobby.id);
    }
    return null;
  };

  const findChannelByName = () => {
    for (const net of store.state.networks) {
      const found = (net.channels || []).find((c: any) => normalizeChannelName(c.name || '') === wanted);
      if (found) return found;
    }
    return null as any;
  };

  // Join if not present yet
  let target = findChannelByName();
  if (!target) {
    const lobbyId = findLobbyId();
    if (lobbyId) {
      socket.emit('input', { target: lobbyId, text: `JOIN #${wanted}` });
    }
    // wait for channel to appear
    await waitUntil(() => !!findChannelByName());
    target = findChannelByName();
  }

  if (!target) return;

  const targetId = String(target.id);
  document.body.setAttribute('data-curia-target-id', targetId);

  // Router guard now handled centrally in router.ts

  // Optional: periodically PART any non-target channels to keep list clean
  setInterval(() => {
    const currentTargetId = document.body.getAttribute('data-curia-target-id');
    if (!currentTargetId) return;
    const lobbyId = findLobbyId();
    if (!lobbyId) return;
    for (const net of store.state.networks) {
      for (const c of (net.channels || [])) {
        if (String(c.id) !== String(currentTargetId) && c.type === 'channel') {
          socket.emit('input', { target: lobbyId, text: `PART ${c.name}` });
        }
      }
    }
  }, 1500);
})();


