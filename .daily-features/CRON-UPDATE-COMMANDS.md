# Cron Update Commands for Builder

## Current State
- Builder is disabled ✅
- E2E test instructions ready ✅
- Gateway restart required after update ✅

## Update Steps

### Step 1: Update Builder Cron Job

Copy the content from `BUILDER-MESSAGE-E2E-UPDATED.md` and use it to update the cron job.

**Method A**: Use cron.update with patch parameter (recommended)
```bash
# Via Clawdbot CLI
# Note: This method may have limitations with large messages
clawdbot cron update --id 5dad283e-5c3f-44c3-afb4-9234078274f8 \
  --patch '{"message": "[FULL MESSAGE FROM BUILDER-MESSAGE-E2E-UPDATED.md]"}'
```

**Method B**: Export/Edit/Import (most reliable)
```bash
# 1. Export current config
clawdbot cron export --id 5dad283e-5c3f-44c3-afb4-9234078274f8 > builder-config.json

# 2. Edit builder-config.json
# Replace the "message" field content with the full message from BUILDER-MESSAGE-E2E-UPDATED.md

# 3. Import updated config
clawdbot cron import --id 5dad283e-5c3f-44c3-afb4-9234078274f8 --file builder-config.json
```

### Step 2: Restart Gateway (CRITICAL)

```bash
clawdbot gateway restart
```

### Step 3: Re-enable Builder

```bash
clawdbot cron update --id 5dad283e-5c3f-44c3-afb4-9234078274f8 --patch '{"enabled": true}'
```

## Files to Reference

1. **`BUILDER-MESSAGE-E2E-UPDATED.md`**
   - Full builder message with E2E test instructions
   - Ready to copy into cron job config

2. **`BUILDER-E2E-TEST-INSTRUCTIONS.md`**
   - Complete E2E test creation workflow
   - Test creation checklist
   - Example test patterns

3. **`TEST-SUITE-STATUS.md`**
   - Current test suite status (60 tests created)

## Cron Job ID

`5dad283e-5c3f-44c3-afb4-9234078274f8`

## Important Reminders

1. **ALWAYS restart gateway** after cron update (LRN-20260130-001)
2. **Builder must be disabled** before updating (as requested by user)
3. **Re-enable after gateway restart** (as requested by user)

---

**Status**: Ready to execute update. See above steps for implementation.
