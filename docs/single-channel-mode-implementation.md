# Single Channel Mode Implementation Research

## Project Overview
This document outlines the complete implementation roadmap for adding "Single Channel Mode" to The Lounge IRC client integration within Curia's chat system.

## Goal
Create a streamlined, focused chat experience that hides unnecessary UI elements when users are participating in a single, specific channel conversation.

## Single Channel Mode Requirements
- Hide left sidebar (network/channel list)
- Hide right sidebar (user list) - optional
- Hide header navigation elements - optional  
- Hide footer/status elements - optional
- Focus entirely on the message area and input
- Maintain theme support (dark/light mode)

## End-to-End Implementation Roadmap

### Phase 1: Chat Modal Package Updates
**Repository**: `/Users/florian/Git/curia/curia-chat-modal`

#### 1.1 Add Single Channel Mode Option to ChatModalProps
**File**: `src/types/index.ts`
**Changes**: 
```typescript
export interface ChatModalProps {
  user: ChatUser;
  community: ChatCommunity;
  theme?: 'light' | 'dark';
  mode?: 'normal' | 'single'; // ← ADD THIS
  chatBaseUrl?: string;
  curiaBaseUrl?: string;
  authToken?: string | null;
  onClose: () => void;
}
```

#### 1.2 Update buildLoungeUrl Function
**File**: `src/utils/api-client.ts`
**Changes**:
```typescript
export function buildLoungeUrl({
  baseUrl,
  ircUsername,
  ircPassword,
  networkName,
  userNick,
  channelName,
  nofocus = true,
  theme,
  mode // ← ADD THIS
}: {
  baseUrl: string;
  ircUsername: string;
  ircPassword: string;
  networkName: string;
  userNick: string;
  channelName: string;
  nofocus?: boolean;
  theme?: 'light' | 'dark';
  mode?: 'normal' | 'single'; // ← ADD THIS
}): string {
  const params = new URLSearchParams({
    password: ircPassword,
    autoconnect: 'true',
    nick: userNick,
    username: `${ircUsername}/${networkName}`,
    realname: userNick,
    join: `#${channelName}`,
    lockchannel: 'true',
    ...(nofocus && { nofocus: 'true' }),
    ...(theme && { theme }),
    ...(mode && { mode }) // ← ADD THIS
  });

  return `${baseUrl}?${params.toString()}`;
}
```

#### 1.3 Update ChatModal Component
**File**: `src/components/ChatModal.tsx`
**Changes**: Pass mode prop through to buildLoungeUrl
```typescript
return buildLoungeUrl({
  baseUrl,
  ircUsername: modalState.credentials.ircUsername,
  ircPassword: modalState.credentials.ircPassword,
  networkName: modalState.credentials.networkName,
  userNick: modalState.credentials.ircUsername,
  channelName,
  nofocus: true,
  theme,
  mode // ← ADD THIS
});
```

### Phase 2: Curia App Integration  
**Repository**: `/Users/florian/Git/curia/curia`

#### 2.1 Update ChatModalWrapper
**File**: `src/components/ChatModalWrapper.tsx`
**Changes**: Add mode prop to ChatModal
```typescript
<ChatModal
  user={{
    id: user.userId,
    name: user.name || 'Anonymous'
  }}
  community={{
    id: community.id,
    name: community.name
  }}
  theme={theme}
  mode="single" // ← ADD THIS (or make it configurable)
  chatBaseUrl={chatBaseUrl}
  curiaBaseUrl={curiaBaseUrl}
  authToken={token}
  onClose={closeChat}
/>
```

### Phase 3: IRC Client Parameter Processing
**Repository**: `/Users/florian/Git/curia/curia-irc-client-source`

#### 3.1 Add Mode Parameter Processing
**File**: `client/js/socket-events/init.ts`
**Changes**: Add mode detection alongside theme detection
```typescript
// Check for autoconnect flag
if (params.has("autoconnect")) {
    // Apply theme directly from URL parameter
    if (params.has("theme")) {
        const theme = params.get("theme");
        if (theme) {
            document.body.setAttribute("data-curia-theme", theme);
            document.body.classList.add(`curia-theme-${theme}`);
        }
    }
    
    // Apply mode directly from URL parameter ← ADD THIS
    if (params.has("mode")) {
        const mode = params.get("mode");
        if (mode) {
            document.body.setAttribute("data-curia-mode", mode);
            document.body.classList.add(`curia-mode-${mode}`);
            console.log('[Mode] Applied mode directly:', mode);
        }
    }
    
    removeQueryParams();
    // Auto-submit network creation instead of showing form
    socket.emit("network:new", queryParams);
    return true;
}
```

### Phase 4: Theme Package Updates
**Repository**: `/Users/florian/Git/curia/curia-irc-theme`

#### 4.1 Research: UI Elements to Hide in Single Channel Mode

**Target Elements Analysis**:

##### Left Sidebar Elements:
- **Selector**: `#sidebar`
- **Contains**: Network list, channel list, connection status
- **Action**: Hide completely in single channel mode

##### Right Sidebar Elements:  
- **Selector**: `#chat .userlist` or `.userlist`
- **Contains**: Online users in current channel
- **Action**: Hide in single channel mode (optional - might keep for large channels)

##### Header Elements:
- **Selector**: `#chat .header` 
- **Contains**: Channel topic, channel name
- **Action**: Simplify or hide non-essential parts

##### Footer Elements:
- **Selector**: `#footer`
- **Contains**: Connection status, settings buttons
- **Action**: Hide or minimize

#### 4.2 Add Single Channel Mode CSS Rules
**File**: `theme.css`
**Changes**: Add comprehensive single channel mode styles
```css
/* Single Channel Mode Styles - Hide UI Elements */
body[data-curia-mode="single"] #sidebar {
    display: none !important;
}

body[data-curia-mode="single"] .userlist {
    display: none !important;
}

/* Optional: Hide header buttons for cleaner interface */
body[data-curia-mode="single"] .header .mentions,
body[data-curia-mode="single"] .header .menu,
body[data-curia-mode="single"] .header .rt {
    display: none !important;
}

/* Optional: Simplify header */
body[data-curia-mode="single"] .header .topic {
    display: none !important;
}

/* Layout adjustments - chat area should auto-expand due to flexbox */
/* The flexbox layout in #viewport should handle width expansion automatically */
/* Additional adjustments if needed: */

body[data-curia-mode="single"] #chat-container {
    /* Ensure full width usage */
    width: 100%;
}

/* Mobile considerations */
@media (max-width: 768px) {
    /* On mobile, sidebar is already hidden by default in most cases */
    /* Single channel mode mainly affects desktop layout */
}
```

#### 4.3 CSS Implementation Strategy
**Approach**: Leverage existing flexbox layout
- **Primary**: Hide sidebar and user list with `display: none`
- **Secondary**: Optionally hide header buttons for cleaner look  
- **Layout**: Existing flexbox should auto-expand chat area
- **Fallback**: Add explicit width adjustments if needed

## Research Status

### ✅ Completed Research:
- [x] End-to-end parameter flow architecture
- [x] File locations across all repositories  
- [x] Integration points identified
- [x] Implementation strategy defined
- [x] Detailed UI element analysis in The Lounge
- [x] CSS selector verification  
- [x] Layout adjustment requirements
- [x] Component structure mapping
- [x] Implementation timeline planning

### 🔍 Detailed UI Element Analysis:

#### Component Structure Analysis
Based on codebase research:

**Main Layout (`App.vue`)**:
- `#viewport` - Main container
- `<Sidebar>` - Left sidebar component (id="sidebar")
- `<router-view>` - Contains Chat component

**Left Sidebar (`Sidebar.vue`)**:
- `#sidebar` - Main sidebar container  
- `.logo-container` - Logo area
- `<NetworkList>` - Network/channel list
- `#footer` - Footer with connect/settings buttons

**Chat Area (`Chat.vue`)**:
- `#chat-container` - Chat wrapper
- `#chat` - Main chat area
- `.header` - Channel header (name, topic, buttons)
- `.chat-content` - Message area
- `<ChatUserList>` - Right sidebar user list
- `<ChatInput>` - Message input

**Right User List (`ChatUserList.vue`)**:
- `.userlist` - User list container
- `.count` - User search input
- `.names` - User names list

#### CSS Selector Analysis
**Primary hide targets for single channel mode**:
```css
/* Left sidebar - contains network/channel list */
#sidebar

/* Right user list - contains online users (optional hide) */
.userlist

/* Footer - contains connect/settings buttons (optional hide) */
#footer

/* Header elements (selective hiding) */
.header .mentions     /* Mentions button */
.header .menu        /* Context menu button */  
.header .rt          /* User list toggle button */
```

#### Layout Adjustment Requirements
**CSS positioning adjustments needed**:
- `#chat` positioning: Currently positioned relative to sidebar
- Main chat area: Needs to expand to full width when sidebar hidden
- Header: May need width adjustments
- Responsive behavior: Ensure mobile compatibility

**Confirmed flexbox-based layout**: When sidebar is hidden, chat area should automatically expand due to flex properties.

## Implementation Timeline

### Sprint 1: Foundation (Chat Modal + Curia App)
1. Update ChatModalProps interface
2. Update buildLoungeUrl function  
3. Update ChatModal component
4. Update ChatModalWrapper component
5. Publish chat modal package
6. Update Curia app dependency

### Sprint 2: IRC Client Integration  
1. Add mode parameter processing to init.ts
2. Test DOM marker application
3. Build and deploy IRC client

### Sprint 3: Theme Styling
1. Research exact UI element selectors
2. Implement single channel mode CSS
3. Test across different screen sizes
4. Publish theme package

### Sprint 4: Testing & Refinement
1. End-to-end testing
2. UI/UX refinements
3. Edge case handling
4. Documentation updates

## Technical Considerations

### Parameter Flow
```
Curia App → ChatModalWrapper (mode="single") 
   ↓
ChatModal → buildLoungeUrl (mode parameter)
   ↓  
IRC Client URL (?autoconnect=true&theme=dark&mode=single)
   ↓
IRC Client → DOM marker (data-curia-mode="single")
   ↓
Theme CSS → Hide elements (body[data-curia-mode="single"])
```

### Fallback Behavior
- If no mode parameter: Display normal full IRC interface
- If invalid mode parameter: Default to normal mode
- Ensure compatibility with existing theme system

### Testing Requirements
- Test with both light and dark themes
- Test on desktop and mobile viewports
- Test parameter combinations
- Test iframe vs standalone behavior

---
*Research Document Created: [Current Date]*
*Status: Initial research complete, pending detailed UI analysis*