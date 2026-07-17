# AGENTS.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.
- **如果不是很明白使用者的表達或需求意圖，請務必透過問答進行確認，不要嘗試盲目猜測。**

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

# Supplementary Guidelines for Rule 5: Agent Skill & Token Optimization

## 1. Mandatory RTK Command Execution
- **When**: Under all conditions, for ANY command execution or task execution in the terminal.
- **Action**: Every single terminal command MUST be prefixed with `rtk` (e.g., `rtk npm run build`, `rtk php`, `rtk git`, `rtk npx sass ...`).
- **Fallback**: If `rtk` fails or is not applicable, notify the user.

## 2. Q&A Confirmation (Clarification Protocol)
- **Trigger**: Instructions are ambiguous, contradictory, missing parameters, or out of scope.
- **Rule**: **Never guess** – always ask specific, bulleted questions.
- **Example**:
  - "Which page needs style changes?"
  - "What is the API endpoint name?"

## 3. Auto-build Verification
- **After every code change**: Run `rtk npm run build`.
- **On failure**: Auto-fix errors and rebuild until success.
- **Escalation**: If repeated failures, report error log and wait for user.

## 4. Style Modification (SCSS Only)
- **Allowed location**: `src/assets/scss/` (e.g., `main.scss`).
- **Prohibited**:
  - `style` attribute in HTML/JSX.
  - Direct edit of `src/assets/css/main.css`.
  - JS-based viewport detection for styling.
- **Responsive**: Use **nested media queries** inside selectors:
  ```scss
  .my-class {
    width: 100%;
    @media (min-width: 768px) { width: 50%; }
    @media (min-width: 1024px) { width: 33%; }
  }
- **Compile: After changes, run:**
rtk npx sass src/assets/scss/main.scss src/assets/css/main.css
- **Verify: Check mobile, tablet, desktop viewports before commit.**

## 5. Automated API Documentation Update
- **Scope:** Any API-related code change (new/modified/deleted endpoints, request/response changes).
- **Target:** src/docs/api_docs.html
- **Content:** Include path, method, params, response samples, error codes, env vars.
- **Timing:** After successful build, before Git commit.

## 6. Auto Git Commit & Push
- **Precondition:** rtk npm run build passes with no errors.
- **Remote:** git@github.com:PutoLim0226/vintage-e-commerce.git (SSH only).
- **Pre‑approved commands (no user confirmation):**
    `rtk git pull`
    `rtk npm run build`
    `rtk git status`
    `rtk git add .`
    `rtk git commit -m "Auto-commit: <summary>"`
    `rtk git push`
- **Flags:** Always add --dangerously-skip-permissions and --auto-approve.
## 7. README.md 同步更新與版本控制規範
- **同步更新**：根目錄的 `README.md`，以及 `frontend/`、`backend/` 目錄下的 `README.md`，均須隨著開發與功能迭代同步更新。
- **版本控制**：
  - 各 `README.md` 需進行版本控制，初始版本號自 `1.0.0` 開始。
  - 每當該目錄之代碼、配置或功能發生變更或更新時，必須於對應的 `README.md` 中遞增其版本號（如 `1.0.0` -> `1.0.1` 等）。
  - 版本號應清晰標註於文檔頂部或顯著位置。

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
