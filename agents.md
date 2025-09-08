# Agent Guidelines: Comments and Self-Documenting Code

We follow a strict self-documenting code philosophy. Keep the code readable through clear naming and small, focused functions. Comments are rare and must add value.

## Comment Policy
- Prefer code that explains itself through meaningful names and structure.
- Never comment out code. Remove it instead.
- Add comments only to capture the "why" when it is not obvious in code (external constraints, non-intuitive tradeoffs, rationale).
- Avoid comments that restate the code, narrate steps, or duplicate identifiers.
- Do not add section headers or boilerplate comments.

Reference: Code Health: To Comment or Not to Comment — `https://testing.googleblog.com/2017/07/code-health-to-comment-or-not-to-comment.html`

## Examples
- Good: brief rationale or external dependency behavior that cannot be encoded in types or structure.
- Avoid: explaining what a loop/filter/map does; the code and names must make that clear.
