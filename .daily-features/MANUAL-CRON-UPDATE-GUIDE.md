# Manual Cron Job Update Instructions

**IMPORTANT**: The `cron` tool has limitations on updating complex payloads with large instructions. Manual configuration is recommended for the builder cron job.

## Current State

✅ Gateway restarted - changes applied
✅ E2E test creation instructions created
✅ Learning logged: LRN-20260130-001 (cron updates require restart)
❌ Builder cron job NOT yet updated with E2E test instructions

## Manual Update Required

The builder cron job's `payload.message` field needs to include E2E test creation instructions.

### Option 1: Via Clawdbot CLI

```bash
# Export current cron job configuration
clawdbot cron export --id 5dad283e-5c3f-44c3-afb4-9234078274f8 > builder-config.json

# Edit builder-config.json to add E2E instructions
# Add the E2E instructions from BUILDER-E2E-TEST-INSTRUCTIONS.md
# Insert BEFORE "PRE-CHECK:" line

# Import updated configuration
clawdbot cron import --id 5dad283e-5c3f-44c3-afb4-9234078274f8 --file builder-config.json

# Restart gateway to apply changes
clawdbot gateway restart
```

### Option 2: Via Web UI

1. Navigate to Clawdbot dashboard
2. Go to Cron Jobs
3. Find "Padelapp Daily Builder" (ID: 5dad283e-5c3f-44c3-afb4-9234078274f8)
4. Edit the job
5. Add E2E test instructions to the Message field
6. Save
7. Restart gateway

### Option 3: Direct API Update

If you have access to the Gateway API:

```bash
# Get current config
curl -X GET "http://localhost:3001/api/cron/jobs/5dad283e-5c3f-44c3-afb4-9234078274f8"

# Update with E2E instructions
curl -X PUT "http://localhost:3001/api/cron/jobs/5dad283e-5c3f-44c3-afb4-9234078274f8" \
  -H "Content-Type: application/json" \
  -d '{
    "payload": {
      "message": "You are the *Padelapp Daily Builder*...\n\n**CRITICAL: E2E TEST CREATION FOR NEW FEATURES**\n\nFor EVERY feature you implement, you MUST create or update E2E tests:\n\n1. **Read the spec** thoroughly to understand what needs to be tested\n\n2. **Create/update E2E test file** at `tests/e2e/[feature-name].spec.ts`...\n\n[rest of E2E instructions from BUILDER-E2E-TEST-INSTRUCTIONS.md]\n\n...PRE-CHECK: Before starting work..."
    }
  }'

# Restart gateway
clawdbot gateway restart
```

## Files for Manual Update

Use these files to help with manual configuration:

1. **`.daily-features/BUILDER-E2E-TEST-INSTRUCTIONS.md`**
   - Complete E2E test creation workflow
   - Test creation checklist
   - Example test patterns

2. **`.daily-features/BUILDER-CRON-INTEGRATION.md`**
   - Integration instructions
   - Position guide (BEFORE "PRE-CHECK:")
   - Cron job ID and reminders

3. **`.daily-features/TEST-SUITE-STATUS.md`**
   - Current test suite status
   - Test coverage overview
   - Files created

## Current Builder Configuration

**Job ID**: `5dad283e-5c3f-44c3-afb4-9234078274f8`
**Job Name**: Padelapp Daily Builder (read from Aprobado list)
**Schedule**: `*/5 * * * *` (every 5 minutes)
**Current Prompt**: Old prompt (without E2E test instructions)

## What to Add

Add the **entire E2E test creation section** from `BUILDER-E2E-TEST-INSTRUCTIONS.md` to the builder's `payload.message` field.

**Insert Position**: BEFORE the "PRE-CHECK:" line

**Sections to Add**:
- CRITICAL: E2E TEST CREATION FOR NEW FEATURES
- TEST CREATION WORKFLOW
- PROGRESS TRACKING UPDATE
- CONSTRAINTS UPDATE
- EXAMPLE TEST CREATION

## After Manual Update

**CRITICAL**: Must restart gateway for changes to take effect:

```bash
clawdbot gateway restart
```

Or via tool:

```yaml
action: restart
reason: Apply builder cron job E2E test instructions
```

## Verification

After update and restart, verify builder includes E2E test instructions:

1. Wait for builder to run (within 5 minutes)
2. Check builder logs for E2E test creation steps
3. Verify test files are created for new features

## Learning Logged

**LRN-20260130-001**: cron_agent_updates_require_restart
- Area: infra
- Priority: high
- Status: pending
- Note: Gateway restart required after cron updates

---

**Status**: Manual configuration update required. See options above.
