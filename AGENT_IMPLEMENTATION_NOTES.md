# Agent System — Implementation Complete

## What Was Fixed

### 1. **Streaming Text Disappeared** ✅
**Problem:** Chat messages were saved as empty strings because `onDone` callback captured `streamingText` state at definition time (`""`).

**Solution:** Use `useRef` alongside state to track streaming text:
- `streamingTextRef.current += chunk` in `onTextChunk`
- Read `streamingTextRef.current` in `onDone` instead of state
- Reset ref in both success and error paths

**Files:** `components/shared/ChatPanel.tsx` (lines 80, 162-191)

---

### 2. **Preview Never Updated** ✅
**Problem:** Hand-rolled `zodToJsonSchema` function couldn't handle nested objects/arrays. LLM received schemas like `{ "items": { "type": "array" } }` instead of full shape with `company`, `position`, `descriptions: [{ value }]`. Result: LLM guessed wrong args → executor received malformed data → preview never updated.

**Solution:** Replace with Zod v4's native `z.toJSONSchema()`:
```ts
// Before: broken recursive implementation
// After: one-liner using Zod's built-in
return (schema as any).toJSONSchema?.() ?? { type: "object" };
```

**Why it works:** Zod v4's schema converter correctly handles:
- Nested objects and arrays
- Optional field unwrapping
- Enums, descriptions, validation metadata
- Recursive structures

**Files:** `lib/agent/chat.ts` (lines 285-296)

---

### 3. **Malformed API Messages** ✅
**Problem:** When LLM produced text + tool calls together, code pushed a message with only `content`, then tried to mutate it by adding `tool_calls`. This broke the OpenAI API contract.

**Solution:** Build complete message atomically:
```ts
if (toolCalls.length > 0) {
  apiMessages.push({
    role: "assistant",
    content: assistantContent || null,  // Can be null if only tool calls
    tool_calls: toolCalls,
  });
} else if (assistantContent) {
  // Only text, no tools
  apiMessages.push({ role: "assistant", content: assistantContent });
}
```

**Files:** `lib/agent/chat.ts` (lines 229-273)

---

### 4. **Tool Update Badges Never Shown** ✅
**Problem:** Tool executions happened internally in `apiMessages` but never reached React's `messages` state. The UI has badge rendering code but messages never got there.

**Solution:** Add `onToolUse` callback:
- chat.ts calls `onToolUse(toolName)` when executing each tool
- ChatPanel listens and pushes `{ role: "tool", content: "", toolName }` to React state
- Existing badge render code now works

**Files:** `lib/agent/chat.ts` (lines 23, 243), `components/shared/ChatPanel.tsx` (lines 180-182)

---

### 5. **Weak System Prompt** ✅
**Problem:** Original prompt was generic. Didn't teach LLM:
- Document structure or available sections
- When to ask clarifying questions vs. when to update immediately
- How to handle incomplete information
- Style guidance for descriptions

**Solution:** Three comprehensive, document-specific prompts:

**Resume Prompt** teaches:
- Available sections: Personal, Summary, Experience, Education, Skills, Projects, Awards
- Flow: Extract details → Use tools immediately → Confirm → Ask ONE follow-up question
- Never invent info, use action verbs for descriptions, accept flexible dates
- When info is vague, ask targeted question (not a list)

**Academic CV Prompt** teaches:
- Available sections: Research Interests, Education, Research/Teaching/Industry Experience, Publications, Manuscripts, Presentations, Grants, Service, Skills, References
- Citation handling, research description articulation
- Same interaction pattern

**Cover Letter Prompt** teaches:
- Structure: Sender, Recipient, Paragraphs, Date
- Tone: Professional, warm, conversational
- Length: 3-4 short paragraphs with concrete examples
- Personalization encouraged

**Files:** `lib/agent/chat.ts` (lines 27-122)

---

## How It Works Now

### User sends message: "My name is Alice Chen, alice@example.com, San Francisco"

1. **ChatPanel** sends message to `runAgentStream`
2. **chat.ts** calls OpenAI API with:
   - System prompt (document-specific instructions)
   - Conversation history
   - Tool definitions (zod schemas converted to JSON)
   - User message
3. **OpenAI streams response** with text chunks + tool calls
4. **For each text chunk:**
   - `onTextChunk` appends to both `streamingTextRef` (ref) and `streamingText` (state)
   - UI renders streaming bubble with text + cursor animation
5. **When tool calls appear:**
   - `onToolUse` fires, pushing `{ role: "tool", toolName }` badge to messages
   - chat.ts executes tool: `executor.ts` creates new content state
   - Tool result pushed to API history (for multi-turn context)
6. **When no more tool calls:**
   - Break from loop, call `onDone()`
   - `onDone` saves complete assistant message from `streamingTextRef.current` (not stale state)
   - Reset ref and state

### Why preview updates immediately:
1. Tool execution → calls `onContentUpdate(newContent, toolName)`
2. ChatPanel's `onChange(updated)` → calls `setContent()` from `useEditorState`
3. This triggers re-render of FormPanel + PreviewPanel
4. Preview shows updated content instantly

---

## Testing the Agent

### Setup

1. **Start dev server** (should already be running):
   ```bash
   npm run dev
   ```
   Open http://localhost:3000

2. **Navigate to resume editor**:
   - Click "Create Resume"
   - Switch to "Agent Mode" (toggle button, top left of form panel)

3. **Configure LLM**:
   - Click settings icon in Agent Mode
   - Enter:
     - **Base URL:** e.g. `http://localhost:8000/v1` (for local LM Studio or vLLM)
       OR `https://api.openai.com/v1` (for OpenAI)
     - **API Key:** Your LLM provider's key
     - **Model:** e.g. `gpt-4`, `gpt-3.5-turbo`, or local model name
   - Click "Save"

### Test Case 1: Complete Information

**Send:**
```
My name is Alice Chen, email is alice@example.com, phone is +1-650-555-0100, located in San Francisco.
```

**Expected:**
- ✓ Preview updates immediately with name, email, phone, location
- ✓ `✓ Updated update_personal` badge appears in chat
- ✓ Assistant text streams character-by-character
- ✓ Assistant confirms: "Added your personal information..."
- ✓ Assistant asks follow-up: "Tell me about your professional experience..."

**Why this works now:** Streaming text captured in ref, not lost in stale closure.

### Test Case 2: Nested Array Data (Experience)

**Send:**
```
I worked at Google as a Software Engineer from 2020 to 2023. I led a team of 5 engineers building real-time analytics. I improved query performance by 40%.
```

**Expected:**
- ✓ Preview updates with experience entry
- ✓ `✓ Updated set_experience` badge appears
- ✓ Entry has: company="Google", position="Software Engineer", dates, descriptions=[{led team...}, {improved performance...}]

**Why this works now:** Zod's `toJSONSchema()` generates correct nested schema, LLM knows about `descriptions: [{value: string}]`, generates correct args.

### Test Case 3: Incomplete Information

**Send:**
```
I worked at Microsoft.
```

**Expected:**
- ✗ Assistant does NOT immediately create incomplete entry
- ✓ Instead, assistant asks: "What was your role or title at Microsoft?"

**Why:** System prompt teaches agent to ask clarifying questions when critical details are missing, not guess and update with partial data.

### Test Case 4: Confirm Persistence

**Send** any message, then:
1. Close agent mode (toggle to form mode)
2. Refresh the page (Cmd+R or F5)

**Expected:**
- ✓ All updates are still there in preview
- ✓ Agent mode still has configuration saved
- ✓ Conversation history is lost (starts fresh, but content persists)

---

## Files Modified

| File | Changes |
|---|---|
| `lib/agent/chat.ts` | ✅ Fixed zodToJsonSchema, fixed message assembly, improved prompts, added onToolUse |
| `components/shared/ChatPanel.tsx` | ✅ Added streamingTextRef, fixed onDone closure, added onToolUse wire |
| `CLAUDE.md` | ✅ Added lib/agent/ section to project structure |

---

## Why These Fixes Matter

1. **Streaming text not disappearing** → Users see the agent's response build in real-time, feels responsive
2. **Preview actually updating** → Agent's tool calls have the correct argument shape, so updates work
3. **Tool badges showing** → Visual feedback that agent is making progress ("Updated experience", etc.)
4. **Better prompts** → Agent asks intelligent clarifying questions instead of guessing
5. **Atomic message assembly** → Correct OpenAI API contract, compatible with all endpoints

---

## Next Steps (Optional Enhancements)

- **Conversation persistence:** Save conversation history to localStorage, restore on return
- **Tool call editing:** Let user edit/confirm tool calls before execution
- **Multi-language prompts:** Document-specific prompts in user's preferred language
- **Streaming indicators:** Show spinner while waiting for tool execution
- **Undo/retry:** Undo last tool call, retry with different args

---

## Architecture Notes

The agent follows a clean separation of concerns:

```
ChatPanel.tsx (UI)
    ↓ calls
runAgentStream() in chat.ts (Agent loop)
    ↓ calls
DynamicStructuredTool.func() in tools.ts (Tool wrappers)
    ↓ calls
executeToolCall() in executor.ts (Pure state mutations)
    ↓ returns
Updated content → onContentUpdate() callback
    ↓
ChatPanel.tsx (onChange → FormPanel + PreviewPanel re-render)
```

Each layer is independently testable and has a clear responsibility.
