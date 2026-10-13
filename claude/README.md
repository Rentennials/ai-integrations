# Rentennials for Claude

Rentennials connector and plugin for Claude. Search car rentals from private owners in Argentina, the United States, Mexico and Peru, compare quotes, request bookings and check your trips.

Payments are completed on a Rentennials-hosted page outside the conversation.

## Install

- From the Claude directory: available once the plugin is published there.
- In Claude Code:

  ```
  /plugin marketplace add Rentennials/ai-integrations
  /plugin install rentennials@rentennials
  ```

- As a custom connector on claude.ai: add a custom connector with the URL `https://mcp.rentennials.app/mcp`.

## What is included

- Connector: the Rentennials MCP server at `https://mcp.rentennials.app/mcp`.
- Skill `rent-a-car`: guides search, quotes, booking requests and existing bookings.

## Privacy Policy

Full policy: https://rentennials.app/privacy-policy

- Profile: name, contact and country details, used to show and complete the profile needed for bookings. Accessed only when you connect your account.
- Bookings: your trips, their status and payment links for your own bookings.
- Sign-in: handled by OAuth through the connection. The plugin contains no credentials and no sign-in tokens.
- Payments: the plugin does not handle or store card details. Payments are completed on Rentennials.

## Support

https://www.rentennials.app/contact
