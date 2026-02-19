# PR Reviewer Quick Start - For All Agents

**Target Role:** All agents (Maya, Jordan, Taylor, Chris)
**Goal:** Faster PR reviews with consistent quality (Sprint 2 Priority: PR hygiene)
**Skill:** `pr-reviewer` v1.0.0
**Estimated Time:** 20 minutes per agent

---

## Step 1: Understand What This Skill Does

`pr-reviewer` automatically reviews GitHub PRs for:
- 🔴 Security issues (hardcoded credentials, API keys)
- 🟡 Error handling gaps (discarded errors, bare excepts)
- 🟠 Risk patterns (panic calls, process.exit)
- 🔵 Style issues (print statements, long lines)
- 📝 TODO markers
- 📊 Test coverage gaps

**Why all agents need this:** Ensures consistent code quality and catches common mistakes before merge.

---

## Step 2: Installation (Already Done ✅)

The `pr-reviewer` skill is installed at:
```
/home/ubuntu/.openclaw/workspace/skills/pr-reviewer
```

You can reference it by name in your tasks: "Use pr-reviewer skill"

---

## Step 3: Prerequisites

You need:
1. `gh` CLI installed and authenticated
   ```bash
   gh auth status
   ```
2. Repository access (read minimum, write for posting comments)

---

## Step 4: Your First Task - Review an Open PR (10 minutes)

Review an existing open PR in the Padel repo:

```
Task: Use pr-reviewer to review PR #42 (or any open PR):
1. Run the review analysis
2. Read the generated report
3. Identify any security issues, error handling gaps, or style problems
4. Note if tests were added for changed source files
5. Summarize findings
```

**Reference:** Read the skill's SKILL.md for commands:
```bash
cat /home/ubuntu/.openclaw/workspace/skills/pr-reviewer/SKILL.md
```

---

## Step 5: Key Commands

```bash
# Check all open PRs
scripts/pr-review.sh check

# Review a specific PR
scripts/pr-review.sh review 42

# Post review as GitHub comment
scripts/pr-review.sh post 42

# Check status of all open PRs
scripts/pr-review.sh status

# List unreviewed PRs (useful for automation)
scripts/pr-review.sh list-unreviewed
```

---

## What Gets Checked

| Category | Icon | Examples |
|----------|------|----------|
| Security | 🔴 | Hardcoded passwords, AWS keys, secrets |
| Error Handling | 🟡 | Go `_ = err`, Python `except:`, unchecked Close() |
| Risk | 🟠 | `panic()`, `process.exit()` |
| Style | 🔵 | `fmt.Print`, `console.log` in prod, long lines |
| TODOs | 📝 | TODO, FIXME, HACK, XXX |
| Test Coverage | 📊 | Source files changed without tests |

---

## Report Format

Each review generates a markdown report with:
- PR metadata (author, branch, changes)
- Commit list
- Changed file categorization (by language/type)
- Diff findings with file, line, category, and context
- Test coverage analysis
- Summary verdict:
  - 🔴 **SECURITY** - Critical security issues found
  - 🟡 **NEEDS ATTENTION** - Important issues to fix
  - 🔵 **MINOR NOTES** - Style improvements suggested
  - ✅ **LOOKS GOOD** - No major issues

---

## Smart Re-Review

The skill tracks HEAD SHA per PR. Only re-reviews when:
- New commits are pushed
- Forced re-review with `review <PR#>`

This saves time — no re-analyzing unchanged PRs.

---

## Heartbeat/Cron Integration

Automate PR reviews by adding to a periodic check:

```bash
UNREVIEWED=$(scripts/pr-review.sh list-unreviewed)
if [ -n "$UNREVIEWED" ]; then
  scripts/pr-review.sh check
fi
```

This can be added to:
- Heartbeat checks (every 30-60 min)
- Cron jobs (scheduled reviews)
- CI workflows (review on every PR)

---

## When to Use This Skill

Use the `pr-reviewer` skill when:
- ✅ Reviewing your own PR before posting
- ✅ Reviewing teammate's PRs
- ✅ Checking for security issues before merge
- ✅ Ensuring test coverage for new features
- ✅ Maintaining code style consistency
- ✅ Setting up automated PR reviews

---

## Configuration

Set these environment variables (auto-detected from git repo):

- `PR_REVIEW_REPO` — GitHub repo (default: detected from `gh repo view`)
- `PR_REVIEW_DIR` — Local checkout path (default: git root)
- `PR_REVIEW_STATE` — State file path (default: `./data/pr-reviews.json`)
- `PR_REVIEW_OUTDIR` — Report output dir (default: `./data/pr-reviews/`)

---

## Extending the Skill

Add new analysis patterns by editing the script's `analyze_diff()` function:

```python
# Add a new pattern
go_patterns.append((
    r'^\+.*os\.Exit\(',
    'RISK',
    'Direct os.Exit() — consider returning error'
))
```

---

## Example Workflow

### Before Posting Your PR
```bash
# 1. Review your changes locally
scripts/pr-review.sh review HEAD

# 2. Fix any issues found
# (edit code)

# 3. Review again
scripts/pr-review.sh review HEAD

# 4. Push PR
git push origin feature/my-feature
```

### Reviewing Teammate's PR
```bash
# 1. Check all open PRs
scripts/pr-review.sh status

# 2. Review a specific PR
scripts/pr-review.sh review 42

# 3. Read the report
cat data/pr-reviews/pr-42.md

# 4. Post review as GitHub comment
scripts/pr-review.sh post 42
```

---

## Questions?

1. **Read** `SKILL.md` for complete reference
2. **Run** `scripts/pr-review.sh check` to see it in action
3. **Ask** if you need help interpreting results

---

**Next Milestone:** Review all open PRs in the Padel repo by end of week
**Long-term Goal:** Automated PR reviews on every PR with 80% issue detection rate

---

**Remember:** Automated review doesn't replace human review — it augments it by catching common issues quickly.
