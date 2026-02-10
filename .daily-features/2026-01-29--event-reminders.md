# Feature: Event Reminders

**Status:** PROPOSED

## Why
The app already has events (recurring padel sessions), but there's no reminder system. Players often forget to RSVP or show up, leading to empty courts or unbalanced teams. Adding event reminders would:

1. **Increase attendance** - Players get nudged before events, reducing no-shows
2. **Better planning** - Admins can see who's confirmed vs who needs reminders
3. **Less friction** - Automated reminders replace manual "don't forget!" messages in group chats
4. **Personalized experience** - Players can set their preferred reminder timing (1h, 4h, 1d before)
5. **Flexibility** - Support multiple reminder channels (in-app, WhatsApp, Telegram)

Most event platforms (Meetup, Facebook Events, Calendly) have reminders because they work: "Reminder: Padel tomorrow at 7PM" = higher attendance.

## Scope
Add event reminder system with flexible timing and multiple channels:
- Configurable reminder times (1h, 4h, 24h before event)
- Per-player reminder preferences (opt-in/opt-out, custom timing)
- Per-event reminder settings (overrides defaults)
- Multiple delivery channels: in-app notification banner, WhatsApp message, Telegram message
- Reminder history log (who got what reminder and when)
- Admin dashboard to view reminder status for upcoming events

### Proposed UX

**1. Player Notification Preferences**
- New settings page at `/g/[slug]/settings/notifications`
- Sections:
  - **Event Reminders**:
    - Toggle: Enable event reminders (default: on)
    - Reminder time options:
      - 1 hour before event
      - 4 hours before event
      - 24 hours before event
      - Custom: [hours] before
    - Delivery channel:
      - In-app notifications only
      - WhatsApp messages (if phone linked)
      - Telegram messages (if linked)
      - All channels
  - **Match Notifications**:
    - Toggle: Notify when match results are published
    - Toggle: Notify when ranking changes (new ELO, position changes)

**2. Event Reminder Configuration**
- On event creation/edit page, add "Reminders" section:
  - Checkbox: Send reminders for this event (default: checked)
  - Time selector: When to send reminders (default: 4h before)
  - Override group defaults for this event

**3. In-App Notification Banner**
- New notification center: Bell icon in navbar (shows badge count for unread)
- Clicking bell opens dropdown with recent notifications:
  - "Event tomorrow at 7PM - RSVP now!" (link to event)
  - "Match results published: Team A vs Team B" (link to match)
  - "Your ranking changed: #12 → #10 (+15 ELO)"
  - Each notification has "Mark as read" button
  - "Clear all" button
- Notification persists until dismissed or max 7 days
- On event page, show "Reminder set: 4h before" indicator

**4. WhatsApp Reminders**
- Use existing WhatsApp integration (wacli) to send messages
- Message format:
  ```
  🎾 Reminder: Padel tomorrow at 7:00 PM
  📍 Location: Club Padel Madrid
  👥 8/12 confirmed - RSVP now!

  Link: https://padel.app/g/padel/events/123
  ```
- Include quick actions (if supported by WhatsApp):
  - "I'm in!" button (links to RSVP)
  - "Not this time" button (links to decline)

**5. Telegram Reminders**
- Send formatted message with event details:
  - Title with emoji
  - Event date/time
  - Location (if set)
  - Attendance summary
  - Link to RSVP
- Inline keyboard buttons for quick actions:
  - [✅ I'm in!] [❌ Not this time]

**6. Admin Reminder Dashboard**
- Admin-only view at `/g/[slug]/admin/reminders`
- Table showing upcoming events and reminder status:
  - Event name, date/time
  - Reminders scheduled (count, timing)
  - Reminders sent (count, timing)
  - Players opted in/out
  - Delivery status (WhatsApp: 8/10 sent, Telegram: 5/10 sent)
- Actions:
  - "Send reminder now" (override timing)
  - "Resend failed reminders"
  - "View reminder log"

### Data Requirements
**New database tables:**

```sql
-- Notification preferences per player
CREATE TABLE notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  event_reminders_enabled boolean NOT NULL DEFAULT true,
  reminder_hours_before integer NOT NULL DEFAULT 4, -- hours before event
  delivery_channels text[] NOT NULL DEFAULT '{in_app}', -- 'in_app', 'whatsapp', 'telegram'
  match_results_enabled boolean NOT NULL DEFAULT true,
  ranking_changes_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(player_id, group_id)
);

-- Reminder schedules per event
CREATE TABLE event_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_occurrence_id uuid NOT NULL REFERENCES event_occurrences(id) ON DELETE CASCADE,
  scheduled_at timestamptz NOT NULL,
  hours_before_event integer NOT NULL,
  sent_at timestamptz,
  delivery_status text NOT NULL DEFAULT 'pending', -- 'pending', 'sending', 'sent', 'failed'
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_occurrence_id, hours_before_event)
);

-- Notification history (all notifications sent)
CREATE TABLE notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  notification_type text NOT NULL, -- 'event_reminder', 'match_result', 'ranking_change'
  delivery_channel text NOT NULL, -- 'in_app', 'whatsapp', 'telegram'
  content text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'sent', -- 'sent', 'failed', 'delivered', 'read'
  metadata jsonb, -- additional data: event_id, reminder_time, etc.
  created_at timestamptz NOT NULL DEFAULT now()
);

-- In-app notifications (persisted for user to read)
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'event_reminder', 'match_result', 'ranking_change', 'system'
  title text NOT NULL,
  message text NOT NULL,
  action_url text, -- link to relevant page
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz -- auto-delete after 7 days
);

-- Indexes for performance
CREATE INDEX idx_notifications_player_unread ON notifications(player_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_notification_log_player_time ON notification_log(player_id, sent_at DESC);
CREATE INDEX idx_event_reminders_scheduled ON event_reminders(scheduled_at) WHERE delivery_status = 'pending';
```

**Changes to existing tables:**
- `event_occurrences`: Add `reminder_override` boolean default false
- `event_occurrences`: Add `reminder_hours_before` integer (nullable, overrides group default)

### Implementation Notes
- **Cron job** to send reminders:
  - Check every 15 minutes for pending reminders (`event_reminders.scheduled_at <= now()`)
  - For each reminder:
    1. Get players opted in for this event
    2. Send notifications via enabled channels
    3. Mark reminder as sent, log to `notification_log`
    4. Create in-app notifications for all opted-in players
- **Server actions:**
  - `updateNotificationPreferences(player_id, preferences)` - save player's notification settings
  - `getUnreadNotifications(player_id)` - fetch in-app notifications
  - `markNotificationAsRead(notification_id)` - dismiss notification
  - `markAllNotificationsAsRead(player_id)` - clear all
  - `scheduleEventReminder(event_occurrence_id, hours_before)` - create reminder entry
  - `sendRemindersNow(event_occurrence_id)` - manual trigger for admin
- **Client components:**
  - `NotificationBell` - navbar component with badge count and dropdown
  - `NotificationSettingsPage` - player preferences form
  - `EventReminderConfig` - event edit page section
  - `AdminReminderDashboard` - admin view of reminder status
- **Notification delivery:**
  - In-app: Create row in `notifications` table
  - WhatsApp: Use existing `wacli` integration (send message to player's phone)
  - Telegram: Use Telegram Bot API via HTTP (need Telegram chat ID per player)
- **Timing logic:**
  - When event occurrence is created, calculate reminder time: `event_occurrence.start_at - (hours_before * INTERVAL '1 hour')`
  - Schedule cron job to check for reminders to send
  - If event time changes, reschedule reminders
- **Error handling:**
  - If WhatsApp/Telegram send fails, log to `notification_log` with status 'failed'
  - Retry failed reminders (exponential backoff: 5min, 15min, 1h, then give up)
  - Show error status in admin dashboard
- **Opt-in flow:**
  - On first event RSVP, ask user: "Enable reminders? (recommended)"
  - Default to ON (players can opt out later)
  - Show notification preferences link in footer: "Manage notifications"

### Technical Considerations
- **Performance:** Cron job every 15 min should be fine for <1000 events. For larger scale, use queue system (Bull, Redis)
- **Rate limiting:** WhatsApp/Telegram have rate limits (messages per second/day). Batch sends with delays between batches
- **Timezone awareness:** All times stored in UTC, convert to group's local timezone for display
- **Cleanup:** Delete expired `notifications` rows (older than 7 days) via cron job
- **Security:** Players can only see/edit their own notification preferences. Admins can manage reminder schedules for events in their group
- **Privacy:** Don't expose other players' notification preferences. Respect opt-outs
- **Testing:**
  - Unit tests for reminder scheduling logic
  - Unit tests for notification preference CRUD
  - E2E tests: Create event, verify reminder scheduled; change time, verify reminder rescheduled
  - E2E tests: Enable/disable preferences, verify notifications sent/not sent
  - Mock wacli/Telegram in tests to avoid sending real messages

## Acceptance Criteria
- [ ] Notification preferences page exists at `/g/[slug]/settings/notifications`
- [ ] Player can enable/disable event reminders
- [ ] Player can select reminder time (1h, 4h, 24h, custom)
- [ ] Player can select delivery channels (in-app, WhatsApp, Telegram)
- [ ] Event creation/edit page shows "Reminders" section
- [ ] Event reminders are scheduled when event occurrence is created
- [ ] Cron job sends reminders at scheduled time
- [ ] Reminder sent via in-app notification (row in `notifications` table)
- [ ] Reminder sent via WhatsApp (if enabled and phone available)
- [ ] Reminder sent via Telegram (if enabled and chat ID available)
- [ ] Notification bell icon in navbar shows badge count for unread notifications
- [ ] Clicking notification bell opens dropdown with recent notifications
- [ ] User can mark notification as read (click "×" or action link)
- [ ] User can mark all notifications as read ("Clear all" button)
- [ ] Notifications expire after 7 days (auto-deleted)
- [ ] Admin reminder dashboard exists at `/g/[slug]/admin/reminders`
- [ ] Admin can view reminder status for upcoming events
- [ ] Admin can send reminder now (override timing)
- [ ] Failed reminders are logged and retry attempted
- [ ] Notification log tracks all sent notifications (type, channel, status)
- [ ] Changing event time reschedules reminders
- [ ] Opting out of reminders prevents user from receiving them
- [ ] Reminder message format matches design (emoji, event details, link)
- [ ] WhatsApp message includes quick action buttons (if supported)
- [ ] Telegram message includes inline keyboard for quick actions
- [ ] Page is responsive (mobile, tablet, desktop)
- [ ] Must pass: `npm test`

## Test Impact
- Add unit tests for reminder scheduling:
  - `scheduleEventReminder` creates correct `event_reminders` entry
  - `calculateReminderTime` returns correct offset from event start
  - Event time change updates reminder time correctly
- Add unit tests for notification preferences:
  - `updateNotificationPreferences` saves correctly
  - `getNotificationPreferences` returns player's settings
  - Default preferences are set correctly
- Add unit tests for cron job:
  - `processPendingReminders` finds reminders to send
  - `sendReminders` calls correct delivery channels
  - Failed reminders are logged with status 'failed'
- Add unit tests for in-app notifications:
  - `createNotification` creates row in `notifications` table
  - `getUnreadNotifications` returns correct count
  - `markNotificationAsRead` sets `read_at` timestamp
- Add E2E tests for notification preferences:
  - Navigate to settings/notifications
  - Enable/disable event reminders
  - Change reminder time
  - Change delivery channels
  - Verify preferences saved
- Add E2E tests for event reminders:
  - Create event with reminders enabled
  - Verify reminder scheduled (check `event_reminders` table)
  - Change event time, verify reminder rescheduled
  - Run cron job, verify reminders sent
  - Verify notification created for user
  - Verify WhatsApp/Telegram messages sent (mocked)
- Add E2E tests for notification bell:
  - Verify bell shows badge count when unread notifications exist
  - Click bell, verify dropdown opens
  - Verify notifications listed with correct format
  - Mark notification as read, verify badge count decreases
- Add E2E tests for admin reminder dashboard:
  - Navigate to admin/reminders
  - Verify upcoming events listed
  - Verify reminder status shown
  - Click "Send reminder now", verify reminder sent immediately

## Estimated Size
medium-large (depends on notification channel integration)

## Notes
- **WhatsApp integration**: Use existing `wacli` CLI if available. Need to map `players.phone_number` to wacli contact IDs. May need to ask players to link their WhatsApp number.
- **Telegram integration**: Need players to link their Telegram account. Use Telegram bot with `/start` command to send their chat ID. Store `player.telegram_chat_id` in a new column.
- **Email option**: Could add email notifications as another channel (use Resend, SendGrid, or similar). For now, stick to in-app + WhatsApp + Telegram.
- **Reminder cadence**: Allow multiple reminder times per event (e.g., 24h AND 4h before). For MVP, single reminder time per event is fine.
- **Sound/vibration**: For mobile app version, could add push notifications with sound. For web version, rely on visual cues (bell badge).
- **Do Not Disturb**: Add global "do not disturb" mode to temporarily disable all notifications (e.g., when on vacation).
- **Frequency limits**: Don't spam users. Cap at 1 reminder per event per channel.
- **A/B test**: Test different reminder times (1h vs 4h vs 24h) to see which increases RSVP rate.
- **Analytics**: Track reminder open rate, RSVP rate after reminder, channel performance (WhatsApp vs Telegram vs in-app).
- **Future enhancements**:
  - "Last chance" reminder (30 min before event if not enough RSVPs)
  - "Good game!" message after match (encouragement)
  - "You haven't played in a while" (re-engagement)
  - Custom reminder messages per event (admin can personalize)
  - Reminder templates (admin can create reusable messages)
