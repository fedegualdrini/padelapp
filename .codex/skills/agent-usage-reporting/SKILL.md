---
name: agent-usage-reporting
description: >
  Ensures each response ends with a short statement of which agent and skills were used.
  Trigger: For every user task or response, regardless of topic.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## When to Use

- Any time the assistant responds to a user request.
- Applies even for small questions, non-code tasks, or refusals.

## Critical Patterns

- Always include a final line stating the agent name and the skills used.
- If no skills were used, explicitly say so.
- Keep the line short and consistent.

## Code Examples

```
Agent: Codex | Skills: agent-usage-reporting, react-19
```

```
Agent: Codex | Skills: none
```

## Commands

```bash
# None
```

