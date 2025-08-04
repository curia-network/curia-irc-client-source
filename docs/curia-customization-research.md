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
- **Implementation**: 
  - Add `data-theme` or class on `<html>` or `#viewport` 
  - Modify `client/css/style.css` CSS variables based on marker
  - Create complementary light/dark theme files

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

## Questions & Next Steps

### Top 3 Questions:
1. **Theme Integration**: Should we implement automatic dark/light mode detection based on system preferences, or manual toggle only?
2. **Single Channel Mode**: Do you want to completely hide the sidebar, or just the network/channel list while keeping connect/settings buttons?
3. **Notification Scope**: Should the Curia notification relay send ALL messages or only mentions/highlights/DMs?

---
*Last updated: [Current exploration]*