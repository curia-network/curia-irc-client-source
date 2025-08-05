# Curia IRC Client Customization Research

## Project Overview
This document tracks our research for customizing The Lounge IRC client for Curia's specific needs.

## Customization Goals
- [ ] Remove or replace logos 
- [ ] Add root marker for dark/light mode and amend theme to serve both 
- [ ] Single channel mode (remove sidebars etc)
- [ ] Restyle chat to look more modern 
- [ ] Add post message relay to hook IRC notifications into Curia notification system

## Project Structure Analysis

### Root Level
- **Type**: The Lounge IRC client (modern web-based IRC client)
- **Build System**: Webpack + TypeScript + Vue.js (based on initial file analysis)
- **Key Files**:
  - `package.json` - Dependencies and build scripts
  - `webpack.config.ts` - Build configuration
  - `index.js` - Entry point

### Key Directories
- `client/` - Frontend Vue.js application
- `server/` - Node.js backend server
- `shared/` - Shared utilities between client/server
- `public/` - Static assets
- `dist/` - Built/compiled output

## Research Findings

### Build System
- **Framework**: Vue.js 3 with TypeScript
- **Build Tool**: Webpack with custom configuration (`webpack.config.ts`)
- **Styling**: PostCSS, CSS custom properties (CSS variables)
- **Dev Server**: Uses `ts-node` for development (`yarn dev`)
- **Build Commands**: 
  - `yarn build:client` - Webpack build for frontend
  - `yarn build:server` - TypeScript compilation for backend
  - `yarn build` - Builds both client and server

### Logo & Branding Locations
- **Logo Files**: Located in `client/img/` directory
  - Multiple variants: horizontal, vertical, inverted, different sizes
  - Key files: `logo-horizontal-transparent-bg.svg`, `logo-transparent-bg-inverted.svg`
- **Logo Implementation**: In `client/components/Sidebar.vue` (lines 4-29)
  - Uses conditional loading: `logo-${isPublic() ? 'horizontal-' : ''}transparent-bg.svg`
  - Has inverted version for dark themes
- **Favicon**: `client/favicon.ico` and various PWA icons

### Theme System Analysis
- **CSS Variables**: Uses CSS custom properties in `:root` for theming
- **Theme Structure**: 
  - Base styles: `client/css/style.css` (2940 lines)
  - Theme files: `client/themes/default.css`, `client/themes/morning.css`
  - Themes extend default via `@import "default.css"`
- **Dark/Light Support**: 
  - Morning theme shows logo switching: `.logo` vs `.logo-inverted`
  - Uses CSS variables for colors (e.g., `--body-color`, `--window-bg-color`)
  - No automatic root-level dark/light mode detection found yet

### UI Component Structure
- **Main App**: `client/components/App.vue` - Root component with sidebar toggle
- **Sidebar**: `client/components/Sidebar.vue` - Contains logo, network list, footer
- **Chat Components**:
  - `Chat.vue` - Main chat area
  - `MessageList.vue` - Message rendering
  - `ChatInput.vue` - Message input
  - `ChatUserList.vue` - User list panel
- **Single Channel Mode**: Sidebar can be hidden via `store.state.appLoaded` or CSS
- **Layout**: Uses `#viewport` container with sidebar overlay system

### Server Architecture
- **Main Files**: 
  - `server/server.ts` (1107 lines) - Main server logic
  - `server/client.ts` (877 lines) - IRC client handling
  - `server/clientManager.ts` - Client connection management
- **Plugin System**: `server/plugins/` directory exists
- **Models**: `server/models/` for data structures

### Notification System Analysis
- **Existing System**: Web Push notifications via `server/plugins/webpush.ts`
  - Uses VAPID keys for authentication
  - Supports browser push notifications
- **Message Flow**: IRC events processed in `server/plugins/irc-events/`
  - `message.ts` handles all message types (notice, action, privmsg, wallops)
  - Perfect hook point for Curia notification relay
- **Event Handlers**: Complete set of IRC event handlers available
  - All message types flow through `handleMessage()` function in `message.ts`
  - Can easily add external API calls here

## Implementation Strategy

### 1. Logo Replacement
- **Target Files**: 
  - Replace files in `client/img/` directory 
  - Update `client/components/Sidebar.vue` lines 4-29 for conditional loading
- **Approach**: Replace SVG files with Curia branding, maintain same naming convention

### 2. Dark/Light Mode Root Marker
- **Current State**: No automatic system preference detection
- **Goal**: Set theme marker based on query parameter from iframe URL
- **Challenge**: Query params are processed and removed during autoconnect flow
- **Implementation Strategy**: Capture → Store → Apply pattern

### 3. Single Channel Mode
- **Target Components**: 
  - `client/components/App.vue` - Hide sidebar conditionally
  - `client/components/Sidebar.vue` - Make hideable
  - `client/components/ChatUserList.vue` - Optionally hide user list
- **Approach**: Add configuration option + CSS classes for minimal layout

### 4. Modern Chat Styling
- **Target Files**: 
  - `client/css/style.css` - Base styles (2940 lines to modernize)
  - Message components: `Message.vue`, `MessageList.vue`
- **Focus Areas**: Typography, spacing, colors, message bubbles, animations

### 5. Curia Notification Relay
- **Hook Point**: `server/plugins/irc-events/message.ts` `handleMessage()` function
- **Implementation**: Add HTTP POST to Curia API after message processing
- **Data**: Send message content, channel, user, timestamp to Curia notification system

## Dark/Light Theme Implementation Roadmap

### Problem Analysis
- **Current Autoconnect Flow**: `client/js/socket-events/init.ts` (lines 188-194)
  - Query params extracted: `const queryParams = Object.fromEntries(params.entries())`
  - Autoconnect triggered: `socket.emit("network:new", queryParams)`
  - URL cleaned: `removeQueryParams()` removes all query parameters
  - **Issue**: Theme information lost after URL cleanup

### Implementation Strategy

#### Phase 1: Capture Theme Parameter
**File**: `client/js/socket-events/init.ts`
**Location**: Before `removeQueryParams()` call (line 190)
**Action**:
```typescript
// Extract and store theme before removing query params
if (params.has("theme")) {
    storage.set("curia.theme", params.get("theme") || "");
}
```

#### Phase 2: Apply Theme Marker  
**File**: `client/js/vue.ts`
**Location**: After Vue app initialization (after line 27)
**Action**:
```typescript
// Apply theme marker to body element
const savedTheme = storage.get("curia.theme");
if (savedTheme) {
    document.body.setAttribute("data-curia-theme", savedTheme);
    // Optional: Also add as CSS class
    document.body.classList.add(`curia-theme-${savedTheme}`);
}
```

#### Phase 3: CSS Integration
**Target**: External theme package (`/Users/florian/Git/curia/curia-irc-theme`)
**Implementation**: CSS selectors targeting the theme marker
```css
/* Light theme styles */
body[data-curia-theme="light"] {
    --primary-color: #ffffff;
    /* ... light theme variables */
}

/* Dark theme styles */  
body[data-curia-theme="dark"] {
    --primary-color: #1a1a1a;
    /* ... dark theme variables */
}

/* Fallback for no theme specified */
body:not([data-curia-theme]) {
    /* Default theme */
}
```

### Flow Diagram
```
Curia App → iframe URL (?autoconnect=true&theme=dark)
     ↓
IRC Client loads → init.ts processes query params
     ↓
Extract theme param → storage.set("curia.theme", "dark")
     ↓  
removeQueryParams() → URL cleaned
     ↓
Vue app initializes → Read storage.get("curia.theme")
     ↓
Apply marker → body[data-curia-theme="dark"]
     ↓
External CSS → Responds to theme marker
```

### Technical Details
- **Storage Key**: `"curia.theme"` (namespaced to avoid conflicts)
- **Supported Values**: `"light"`, `"dark"` (extensible for future themes)
- **Fallback**: No marker applied if no theme specified
- **Persistence**: Uses existing `localStorage.ts` wrapper with error handling
- **CSS Specificity**: `body[data-curia-theme="X"]` provides high specificity

### Integration Points
1. **Query Parameter**: `?theme=dark` or `?theme=light` in iframe URL
2. **Storage**: Persisted in localStorage between page loads
3. **DOM**: Applied as data attribute and/or CSS class
4. **External CSS**: Theme package reads marker for styling

## Questions & Next Steps

### Top 3 Questions:
1. **Theme Values**: Should we support only "light"/"dark" or additional theme variants?
2. **Single Channel Mode**: Do you want to completely hide the sidebar, or just the network/channel list while keeping connect/settings buttons?
3. **Notification Scope**: Should the Curia notification relay send ALL messages or only mentions/highlights/DMs?

---
*Last updated: Dark/Light theme roadmap completed*