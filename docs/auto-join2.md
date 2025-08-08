Below is a tight, “use what’s supported” research brief you can hand to your Cursor agent. I’ve split findings from recommendations, and I cite the official The Lounge docs wherever they exist.

⸻

What The Lounge officially supports (vs. not)

URL params / focusing a channel
	•	Documented URL overrides exist only for public mode (?join, ?nick, …). There is no documented parameter to set the active channel in private mode—nor a param to disable state restore.  ￼

Config flags related to locking things down
	•	lockNetwork (config.js) can restrict network editing (host/port/TLS) but does not control which channel gets focus.  ￼
	•	No config option is documented to disable “restore last active channel” or to enable a single‑channel/kiosk mode. (The config reference lists all client/server settings; nothing addresses focus restore.)  ￼

Supported extension points (API)
	•	Server‑side plugin API is documented and includes:
	•	Commands.add() to register /yourcommand.  ￼
	•	Public Client API:
	•	runAsUser("JOIN #chan", targetId) – sends a command as if the user typed it.
	•	sendToBrowser(event, data) – emit a socket event to that browser session (you provide the event name).
	•	createChannel, sendMessage, getChannel.  ￼
	•	The API docs explicitly warn it’s not yet finalized (expect changes across versions), but these surfaces are the officially documented ones today.  ￼

No documented “client connected / post‑sync” server hook. The public docs list how to register commands and use the Public Client, but do not expose a lifecycle callback like “on client ready.” Use a client‑side hook to initiate focus, or trigger a command from the client.  ￼

⸻

Why “join appears in the sidebar but focus stays elsewhere”
	•	In private mode, The Lounge persists your session and restores last state when you come back. You can still auto‑join the channel (hence it appears in the sidebar), but state restore wins unless you actively change focus after sync. This is by design of private mode; there’s no config to disable it.  ￼

⸻

Recommended implementation patterns (robust & upgrade‑friendly)

Pattern A — Client‑only “single‑channel kiosk” guard (recommended)

Why: Minimal surface area, no server coupling, and avoids relying on undocumented server lifecycle hooks. It also decisively wins over “late” focus changes.

What to implement in your fork (Vue client):
	1.	Target channel discovery
	•	Read ?focus=#chan (or reuse your ?join value’s first entry).
	•	Normalize to #name.
	2.	Wait for initial sync deterministically
	•	Poll the store until at least one network and its channel list exist (avoids relying on internal socket event names). Then:
	•	If the target channel isn’t joined → call /JOIN using the Public Client API by emitting the command from the client (or via your earlier autoconnect flow).
	•	If joined → record its chan.id.
	3.	Global router guard to enforce focus
	•	Install a beforeEach guard: if the next route is a different channel (or a special panel), replace with the target channel route ({ name: 'chan', params: { id } }).
	•	This prevents late UI switches caused by state restore or other actions.
	4.	Optional safety: auto‑PART any non‑target joins
	•	Set a small interval that scans joined channels; if a non‑target channel appears, issue runAsUser("PART #other", lobbyId). This keeps the left list clean and prevents accidental focus steals. (Uses documented Public Client API only.)  ￼
	5.	Hide navigation affordances in your theme
	•	You already hide the sidebar via your theme; keep it to remove click paths.

Why this is stable: you only depend on:
	•	URL parsing (your code),
	•	Vue router’s public API (your code),
	•	Documented Public Client API for /JOIN/PART if needed.  ￼
No reliance on private socket event names or internal mutations.

Cursor‑level sketch (client):

// kiosk-focus.ts — register once during app bootstrap
const targetName = readFocusOrJoinFromLocation(); // "#florilicious"

await waitUntil(() => hasNetworksAndChannelsLoaded());

let chan = findChannelByName(targetName);
if (!chan) {
  // Use your existing autoconnect path or emit input to run a JOIN
  emitInput(`/join ${targetName}`); // same format as typing in the input box
  chan = await waitForChannel(targetName);
}

const targetId = String(chan.id);

// Router guard that always reroutes to the target channel
router.beforeEach((to, from, next) => {
  if (to.name === "chan" && String(to.params.id) !== targetId) {
    next({ name: "chan", params: { id: targetId }, replace: true });
    return;
  }
  // prevent navigating to other panels/queries, if desired
  if (to.name !== "chan") {
    next({ name: "chan", params: { id: targetId }, replace: true });
    return;
  }
  next();
});

// Optional: periodic PART of non-target joined channels using Public Client API
setInterval(() => {
  for (const c of joinedChannels()) {
    if (c.name.toLowerCase() !== targetName.toLowerCase()) {
      runAsUser(`PART ${c.name}`, lobbyId()); // Public Client API call
    }
  }
}, 1500);

runAsUser/“as if typed by user” is documented. You’ll implement emitInput/runAsUser wrappers per your fork; the API contract is stable in docs.  ￼

⸻

Pattern B — Server+client handshake (plugin) with a browser focus event

Why: Uses the documented plugin API surfaces and keeps client logic tiny, but you still need one client‑side listener.

Pieces:
	•	A server plugin that exposes a command like /focus-join #chan:
	•	Server calls client.runAsUser("JOIN #chan", lobbyId) if needed, then
	•	client.sendToBrowser("cg:focus-channel", { name: "#chan" }).  ￼
	•	A 10‑line client listener that, upon receiving cg:focus-channel, finds/awaits the channel in the store and navigates to it via the router.

How to trigger it deterministically
	•	Because there’s no documented “client connected” server hook, the client should send a one‑shot /focus-join immediately after your autoconnect logic (you already have that flow). This keeps control on the client side while using only documented server APIs.  ￼

When to prefer Pattern B
	•	If you want a reusable command ops can use (/focus-join #chan) and a single codepath (command) that both your iframe loader and human operators can reuse.

⸻

Answers to your specific questions

Q: Disable “restore last active channel” in private mode?

A: No documented config for this; the config reference doesn’t include such a toggle. Private mode persists and restores session state by design.  ￼

Q: Single‑channel / kiosk mode built‑in?

A: No. Use a client guard (Pattern A) and theme to hide navigation. lockNetwork helps prevent editing the server, not focus.  ￼

Q: Supported ways to set active channel deterministically?
	•	Public Client API is the supported surface you can rely on to join/part (not to “focus”). Use it in combination with a router guard to enforce focus (Pattern A) or with a sendToBrowser event + client listener (Pattern B).  ￼
	•	Router‑level: A global beforeEach guard is the most reliable way to beat state‑restore and any late UI switches. (This is your code; the docs don’t prescribe it.)
	•	Store‑level: Avoid patching internal mutations (undocumented and refactor‑prone). Prefer router guard + optional periodic PARTs via the Public Client API.

Q: Server‑side “after connect” hook?

A: Not documented. The public API shows how to register commands and interact with a specific client (Public Client) but doesn’t expose a connect‑lifecycle callback. Initiate focus from the client, or have the client immediately trigger your command.  ￼

Q: Channel list control / preventing focus steals?
	•	Limit visible channels: safe to hide the sidebar via a theme (documented theming).  ￼
	•	Prevent non‑target joins: simplest is a client watcher that auto‑PARTs anything that isn’t your target channel using runAsUser("PART …"). (Fully documented API call).  ￼
	•	If you must allow some channels (e.g., lobby + one target), maintain an allowlist in your client guard and PART the rest.

Q: Any private‑mode URL pattern to set active channel?

A: No. URL overrides are explicitly “In public mode only”. The canonical, future‑proof approach is Pattern A or Pattern B above.  ￼

⸻

Exact places to implement (your fork)
	•	Bootstrap point (client): Where the app registers socket listeners / creates the Vue app—import your kiosk‑focus module here so it runs once on load.
	•	Router guard (client): Add router.beforeEach in your app initialization file (client/js/router.* or wherever the router is created).
	•	Optional plugin (server): Register /focus-join via Commands.add in your plugin’s onServerStart. Use Public Client methods runAsUser, sendToBrowser.  ￼

⸻

Gotchas & neutralization

Gotcha	Symptom	Fix
State restore in private mode	Opens the last channel a user had focused	Router guard that reroutes to the target channel on every navigation attempt (Pattern A).  ￼
Late switch from user actions	Clicking another channel or opening panels changes focus	Same guard; optionally hide navigation via theme.  ￼
Joins caused by invites/commands	New channels appear and may grab attention	Run periodic auto‑PART of non‑allowlisted channels via runAsUser.  ￼
Relying on private socket/event names	Breaks on upgrades	Avoid. Poll store for “channels loaded” and use router guard + Public Client API only (documented).  ￼
API stability	Plugin API may change over time	Keep plugin tiny; pin The Lounge version; track the API reference notice.  ￼


⸻

TL;DR for your Cursor agent
	•	There’s no official “focus” URL param or config in private mode; URL overrides are public‑mode only.  ￼
	•	Implement Pattern A (client‑only):
	1.	Parse ?focus/?join.
	2.	Wait until networks/channels exist.
	3.	If needed, JOIN via user‑style command.
	4.	Install a global router guard that always routes to the target channel’s route.
	5.	Optionally auto‑PART any non‑target joins using runAsUser.  ￼
	•	Or Pattern B (server+client): tiny plugin with /focus-join that calls runAsUser then sendToBrowser("cg:focus-channel", { name }), and a 10‑line client listener that navigates to it. Trigger the command from the client on load (no official connect hook).  ￼

If you want, I can turn Pattern A into a drop‑in TS module for your fork (guard + PART allowlist) and Pattern B into a minimal plugin + client listener.