# 🚀 Feature Proposals - Ticket Site

**Date:** 2026-10-25  
**Project:** ticket-site (Next.js Event Discovery Platform)  

---

## Executive Summary

Based on comprehensive codebase analysis, I propose **3 high-value features** for the Ticket Site that align with its core purpose: event discovery and trip planning. These features address real user needs while leveraging existing architecture.

**Ranking by Impact vs Effort:**
1. 🥇 **Feature 1: Event Wishlists & Sharing** (High impact, Medium effort)
2. 🥈 **Feature 2: Collaborative Trip Planning** (Medium impact, Small-Medium effort)  
3. 🥉 **Feature 3: Price Drop Alerts** (High impact, Large effort)

---

## Feature 1: Event Wishlists & Sharing

### User Problem Solved
Users find events they're interested in but can't easily save them for later or share with friends to compare options and plan group trips together.

### Target Users
- Event planners organizing group outings
- Couples planning date nights
- Friends coordinating group activities
- Travelers saving potential destinations

### User Experience & Workflow
`
1. User browses events → Clicks "Save to Wishlist" (heart icon)
2. Events appear in user's wishlist dashboard
3. Users can organize wishlists by category or trip
4. Share wishlist via link with friends/family
5. Collaborate: others add/remove/comment on wishlist items
6. Convert wishlist items to itinerary stops
`

### Main Functionality
- **Wishlist Creation:** Create unlimited wishlists per user
- **Event Saving:** One-click save from event cards
- **Dashboard View:** Grid/list view of saved events with filters
- **Sharing:** Generate shareable links (read-only for recipients)
- **Collaboration:** Multiple users can contribute to same wishlist
- **Reminders:** Email notifications for upcoming saved events

### Required Frontend Changes

#### New Components:
1. components/WishlistButton.tsx - Heart icon button on event cards
2. components/WishlistItem.tsx - Individual wishlist entry with actions
3. pages/wishlists/[id]/page.tsx - Wishlist detail view
4. pages/wishlists/new/page.tsx - Create new wishlist form

#### State Management:
- Add wishlistId to EventItem type in lib/types.ts
- Use Next.js cookies or auth tokens for user preferences storage

### Required Backend & API Changes

#### New API Endpoints:
`	ypescript
// POST /api/wishlists - Create new wishlist
// GET  /api/wishlists - List user's wishlists  
// GET  /api/wishlists/[id] - Get wishlist details
// POST /api/wishlists/[id]/events - Add event to wishlist
// DELETE /api/wishlists/[id]/events/:eventId - Remove from wishlist
// GET  /api/wishlists/share/[token] - Public view of shared wishlist
`

#### Data Model:
`	ypescript
type Wishlist = {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string; // User ID from auth system
};

type WishlistEvent = {
  wishlistId: string;
  eventId: string;
  addedAt: Date;
  notes?: string;
};
`

### Database or Schema Changes
**Option A - Serverless (Recommended):** Use external service like Supabase, Firebase, or PocketBase  
**Option B - Custom:** Implement with SQLite/PostgreSQL + ORM  

**Schema (SQLite example):**
`sql
CREATE TABLE wishlists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE wishlist_events (
  id TEXT PRIMARY KEY,
  wishlist_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  FOREIGN KEY (wishlist_id) REFERENCES wishlists(id),
  UNIQUE(wishlist_id, event_id)
);

CREATE TABLE wishlist_shares (
  id TEXT PRIMARY KEY,
  wishlist_id TEXT NOT NULL,
  share_token TEXT UNIQUE NOT NULL,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (wishlist_id) REFERENCES wishlists(id)
);
`

### Security & Privacy Considerations
- **Authentication Required:** Users must be logged in to create/edit wishlists
- **Share Tokens:** Use secure random tokens with expiration (7 days default)
- **Privacy:** Users control who can view their wishlists
- **Data Retention:** Auto-delete share tokens after expiration

### External Integrations Needed
- None required (can use existing auth system or add simple session-based auth)

### Implementation Effort: **Medium** (8-12 hours)
- Backend API: 4-6 hours
- Frontend components: 3-5 hours  
- Testing & polish: 2-3 hours

### Business Value & User Impact
- **Retention:** Users return to check wishlists before booking
- **Social Sharing:** Viral growth through wishlist sharing
- **Conversion:** Wishlist items are more likely to be purchased (proven in e-commerce)
- **Group Planning:** Enables collaborative trip planning

### Dependencies & Risks
**Dependencies:**
- User authentication system (add if not present)
- Database or external storage service

**Risks:**
- Storage costs for wishlist data (mitigate with pagination/archival)
- Complexity increase in state management

### Acceptance Criteria
- [ ] Users can create unlimited wishlists
- [ ] Events can be saved/removed from wishlists
- [ ] Wishlist links work without login (read-only view)
- [ ] Collaborative editing works for shared wishlists  
- [ ] Mobile-responsive wishlist views
- [ ] Email reminders for upcoming events in wishlists

### Recommended Implementation Priority: **P1 - High**

---

## Feature 2: Collaborative Trip Planning

### User Problem Solved
Currently, the road trip planner stores data only in session memory. Users can't save trips, share them with travel companions, or build multi-day itineraries across multiple sessions.

### Target Users
- Families planning vacations
- Friend groups organizing road trips
- Couples planning honeymoons
- Corporate retreat planners

### User Experience & Workflow
`
1. User creates new trip (name, start/end cities)
2. Adds events/attractions as stops
3. Invites friends via email or share link
4. Friends add their own suggestions and vote on priorities
5. Group discusses and refines itinerary together
6. Final itinerary can be exported to PDF/calendar
`

### Main Functionality
- **Trip Creation:** Multi-day trip planning interface
- **Stop Management:** Add/remove/reorder stops with drag-and-drop
- **Collaboration:** Real-time or async contributions from multiple users
- **Voting System:** Upvote/downvote suggested stops
- **Timeline View:** Visual timeline of the entire trip
- **Export Options:** PDF itinerary, Google Calendar import

### Required Frontend Changes

#### New Components:
1. components/TripPlanner.tsx - Enhanced road trip planner with persistence
2. components/StopCard.tsx - Individual stop display with voting
3. components/VotingPanel.tsx - Upvote/downvote interface
4. pages/trips/[id]/page.tsx - Trip detail and editing view

#### State Management:
- Replace session-only state with persistent storage
- Add real-time sync for collaborative features (WebSocket or polling)

### Required Backend & API Changes

#### New API Endpoints:
`	ypescript
// POST /api/trips - Create new trip
// GET  /api/trips - List user's trips
// GET  /api/trips/[id] - Get trip details
// PUT  /api/trips/[id] - Update trip
// DELETE /api/trips/[id] - Delete trip
// POST /api/trips/[id]/stops - Add stop to trip
// PUT  /api/trips/[id]/stops/reorder - Reorder stops
// GET  /api/trips/share/[token] - Public view of shared trip
`

#### Collaboration Features:
- WebSocket endpoint for real-time updates (optional)
- Polling-based sync for simpler implementation

### Database or Schema Changes

**Schema:**
`sql
CREATE TABLE trips (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  start_city TEXT NOT NULL,
  end_city TEXT NOT NULL,
  startDate DATETIME,
  endDate DATETIME,
  ownerId TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE trip_stops (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL,
  stop_order INTEGER NOT NULL,
  title TEXT NOT NULL,
  kind TEXT NOT NULL, -- 'event' | 'attraction' | 'custom'
  latitude REAL,
  longitude REAL,
  date DATETIME,
  visit_duration_minutes INTEGER,
  start_time TEXT,
  cost_per_person REAL,
  cost_per_vehicle REAL,
  currency TEXT DEFAULT 'USD',
  cost_status TEXT, -- 'source-provided' | 'user-estimate' | 'unknown'
  notes TEXT,
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trip_id) REFERENCES trips(id),
  UNIQUE(trip_id, stop_order)
);

CREATE TABLE trip_votes (
  id TEXT PRIMARY KEY,
  stop_id TEXT NOT NULL,
  voter_id TEXT NOT NULL,
  vote_type INTEGER CHECK(vote_type IN (-1, 1)), -- -1 = downvote, 1 = upvote
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (stop_id) REFERENCES trip_stops(id),
  UNIQUE(stop_id, voter_id)
);

CREATE TABLE trip_shares (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL,
  share_token TEXT UNIQUE NOT NULL,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trip_id) REFERENCES trips(id)
);
`

### Security & Privacy Considerations
- **Authentication Required:** Only authenticated users can create/edit trips
- **Share Tokens:** Secure tokens with expiration for public viewing
- **Privacy Controls:** Users can make trips private or shareable
- **Data Ownership:** Clear terms about who owns trip data

### External Integrations Needed
- **Email Service:** Send collaboration invitations (SendGrid, Resend, etc.)
- **Calendar Export:** Google Calendar/Apple Calendar import/export
- **PDF Generation:** Itinerary export as PDF

### Implementation Effort: **Small-Medium** (6-10 hours)
- Backend API: 3-4 hours
- Frontend components: 2-3 hours  
- Database setup: 1-2 hours
- Testing & polish: 1-2 hours

### Business Value & User Impact
- **Engagement:** Users invest more time in trips they can save and share
- **Social Features:** Encourages group planning and viral sharing
- **Conversion:** Planned trips are more likely to result in ticket purchases
- **Brand Loyalty:** Users return to plan future trips

### Dependencies & Risks
**Dependencies:**
- User authentication system
- Email service for invitations
- Database or external storage

**Risks:**
- Real-time sync complexity (can start with polling)
- Storage costs for trip data
- Data migration from session-only approach

### Acceptance Criteria
- [ ] Users can create and save trips across sessions
- [ ] Multiple users can contribute to same trip
- [ ] Drag-and-drop stop reordering works
- [ ] Voting system displays correctly
- [ ] Trip export to PDF/calendar works
- [ ] Email invitations send successfully

### Recommended Implementation Priority: **P1 - High**

---

## Feature 3: Price Drop Alerts

### User Problem Solved
Users find events they want to attend but can't afford right now. They want to be notified when prices drop or when tickets go on sale so they don't miss limited-time deals.

### Target Users
- Budget-conscious event attendees
- Fans of specific artists/teams (want best price)
- Last-minute planners looking for deals
- Students and young professionals

### User Experience & Workflow
`
1. User browses events → Clicks "Set Price Alert" on expensive tickets
2. Enters email address and preferred max price
3. Gets notified via email when:
   - Tickets go on sale
   - Prices drop below threshold
   - Limited-time deals appear
4. Can manage alerts from dashboard
5. One-click purchase when alert triggers
`

### Main Functionality
- **Alert Creation:** Set price thresholds for specific events
- **Email Notifications:** Timely alerts with direct purchase links
- **Dashboard Management:** View, edit, delete all active alerts
- **Deal History:** Track which alerts triggered and saved money
- **Smart Suggestions:** AI-powered suggestions based on browsing history

### Required Frontend Changes

#### New Components:
1. components/PriceAlertButton.tsx - Alert button on event cards
2. pages/alerts/page.tsx - Manage price alerts dashboard
3. components/DealNotification.tsx - In-app deal notifications

#### State Management:
- Store active alerts in user preferences (database)
- Real-time notification system for new deals

### Required Backend & API Changes

#### New API Endpoints:
`	ypescript
// POST /api/alerts - Create price alert
// GET  /api/alerts - List user's active alerts
// PUT  /api/alerts/[id] - Update alert threshold
// DELETE /api/alerts/[id] - Delete alert
// POST /api/deals - Trigger deal notification (manual or automated)
`

#### Automated Monitoring:
- Background job to check event prices periodically
- Webhook integration with Ticketmaster for price changes

### Database or Schema Changes

**Schema:**
`sql
CREATE TABLE price_alerts (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  max_price REAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  triggered_at DATETIME,
  FOREIGN KEY (event_id) REFERENCES events(event_id),
  UNIQUE(event_id, user_id)
);

CREATE TABLE deal_notifications (
  id TEXT PRIMARY KEY,
  alert_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  original_price REAL,
  new_price REAL,
  notification_sent BOOLEAN DEFAULT FALSE,
  sent_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (alert_id) REFERENCES price_alerts(id),
  UNIQUE(alert_id, user_id)
);
`

### Security & Privacy Considerations
- **Email Verification:** Verify email addresses before sending alerts
- **Rate Limiting:** Prevent alert spam (max 10 active alerts per user)
- **Data Privacy:** Don't store full event details in alerts (only IDs)
- **Opt-out Options:** Easy unsubscribe from deal notifications

### External Integrations Needed
- **Email Service:** SendGrid, Resend, or similar for deal notifications
- **Background Jobs:** For periodic price monitoring (Next.js scheduled functions or external service)
- **Webhooks:** Ticketmaster API webhooks for real-time price updates (if available)

### Implementation Effort: **Large** (12-16 hours)
- Backend API & background jobs: 6-8 hours
- Frontend components: 3-4 hours  
- Email integration: 2-3 hours
- Testing & polish: 2-3 hours

### Business Value & User Impact
- **Engagement:** Users stay engaged waiting for deals
- **Conversion:** Price-sensitive users convert when alerted
- **Retention:** Deal notifications bring users back to site
- **Competitive Advantage:** Unique feature not offered by competitors

### Dependencies & Risks
**Dependencies:**
- Email service integration
- Background job system (Next.js scheduled functions or external)
- Ticketmaster API webhook support (if available)

**Risks:**
- False positives in price monitoring
- Email deliverability issues
- Complexity of background job management

### Acceptance Criteria
- [ ] Users can set price alerts for events
- [ ] Email notifications arrive within 5 minutes of price change
- [ ] Alert dashboard shows all active alerts
- [ ] Users can manage alert preferences easily
- [ ] Rate limiting prevents abuse (max 10 alerts/user)
- [ ] Deal history tracks savings

### Recommended Implementation Priority: **P2 - Medium**

---

## Summary Comparison Table

| Feature | Impact | Effort | ROI | Priority | Timeline |
|---------|--------|--------|-----|----------|----------|
| Event Wishlists & Sharing | High | Medium | High | P1 | 2-3 weeks |
| Collaborative Trip Planning | Medium | Small-Medium | Medium-High | P1 | 1.5-2 weeks |
| Price Drop Alerts | High | Large | High | P2 | 3-4 weeks |

---

## Implementation Roadmap Recommendation

### Phase 1 (Weeks 1-2): Quick Wins
1. **Event Wishlists & Sharing** - Highest ROI, medium complexity
2. Add basic sharing functionality first
3. Implement collaboration features in iteration 2

### Phase 2 (Weeks 3-4): Trip Planning Enhancement  
1. Migrate road trip planner to persistent storage
2. Add collaborative editing
3. Implement voting and timeline views

### Phase 3 (Weeks 5-8): Deal Engine
1. Set up background job system
2. Integrate email service
3. Build price monitoring logic
4. Launch with limited alert types

---

*Feature proposals generated by AI Code Analysis - 2026-10-25*

