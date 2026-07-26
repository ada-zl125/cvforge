# Security Policy

## Project Scope

CVForge is a browser based application with no user accounts, application database, or document storage server.

Documents, Agent Mode state, uploaded references, and project instructions use `sessionStorage`. LLM configuration, including the API key, and interface language use `localStorage`.

Agent Mode connects from the browser to the model provider configured by the user. When Agent Mode runs, the provider may receive the current document, user request, relevant conversation context, project instructions, and reference content read by the agent. That provider handles the request under its own security and privacy terms.

## Protecting Local Data

1. Use CVForge only on a trusted device and browser profile.
2. Use a restricted API key when the provider supports it.
3. Remove the saved model configuration after using a shared device.
4. Review uploaded files before making them available to Agent Mode.
5. Clear browser data when local document or model settings should be removed.

CVForge cannot recover deleted browser data or compromised API keys.

## Reporting a Vulnerability

Do not publish secrets, personal data, or exploit details in a public issue.

Use GitHub private vulnerability reporting when it is available for this repository. If it is unavailable, open a brief public issue without sensitive details and ask the maintainers to arrange a private channel.

Include the affected area, reproduction steps, expected impact, and a minimal proof when safe.
