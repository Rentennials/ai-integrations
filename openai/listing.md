# Rentennials

Status: draft. Public support URL, official icons, screenshots and client review evidence are pending.

## App information

- Display name: Rentennials
- Short description: Find and book rental cars
- Developer: Rentennials
- Category: Travel
- Capabilities: Read, Write
- Website: https://www.rentennials.app
- Privacy: https://rentennials.app/privacy-policy
- Terms: https://www.rentennials.app/terms-and-conditions
- Support: pending an approved HTTPS page; configure OPENAI_SUPPORT_URL when packaging.
- Locales: English and Spanish. Countries: AR, US, MX, PE.

Find cars on Rentennials in Argentina, the United States, Mexico and Peru. Compare vehicles, pickup options, owner conditions and quotes with coverages and extras. Connect your account to see your trips and request a booking after explicitly confirming its price and dates. Some vehicles require owner approval and others immediate payment. Payment happens on a secure Rentennials-hosted page outside the conversation. Flights, in-chat card payments and booking cancellations are outside this plugin's scope.

## MCP server

Production endpoint: https://mcp.rentennials.app/mcp. Streamable HTTP, OAuth with per-tool scopes. Server and domain verification must be completed before review.

| Tool | Reason and permissions |
| --- | --- |
| ping | Read-only anonymous connection diagnostic; returns server status/time. |
| get_auth_status | Read-only connection state and granted scopes; allows anonymous use and does not return credentials. |
| list_locations | Read-only public catalog of supported rental locations. |
| list_meeting_points | Read-only public pickup/return catalog; references support location selection. |
| search_vehicles | Read-only public catalog search. Vehicle id and slug are required references for quoting and details, not user identity. |
| get_vehicle | Read-only public details, normalized features and owner conditions. Text remains untrusted data. Meeting-point references select vehicle-specific options. |
| get_vehicle_quote | Read-only price calculation for exact dates; coverage/extra references select options. It does not reserve or charge. |
| get_current_user | profile:read; reads the connected user's profile and missing payment fields. Contact/name/country data supports profile completion; stored identity document and birth date values are not returned by the approved server change. |
| update_current_user | profile:write; saves only supported profile fields requested by the connected user. Verified accounts can change only contact fields. Identity values supplied for completion are not echoed back. |
| list_bookings | bookings:read; lists only the connected user's bookings. booking_id is required to request detail or payment, not exposed as a human-readable trip label. |
| get_booking | bookings:read; enforces ownership before returning trip details. |
| create_booking_request | bookings:write; destructive, non-idempotent booking creation. Requires confirmed=true after explicit approval. The UI sends a chat message and does not invoke it. |
| update_owner_message | bookings:write; replaces the connected user's note on their booking, using only their own words. No copied owner instructions. |
| pay_booking | bookings:write; non-idempotent creation of a payment session for an eligible owned booking. It captures no payment itself and returns a time-limited external link. |

References are necessary to chain the published tools. No internal JWT, OAuth token, reviewer credentials, real fixture identifiers or card details belong in the package. Profile data handling must match the deployed server and privacy policy before submission.

## Commerce description

Rentennials is a peer-to-peer car rental marketplace. The plugin lets users search, quote and request bookings. No payment is captured inside ChatGPT and no card data is handled in the conversation. After explicit booking confirmation, the server may return a time-limited link to a Rentennials-hosted payment page. Approved bookings use the same external payment mechanism. Rental totals, currency, payment amounts and link expiry come from the server. Rentennials Fast, when available, includes a later automatic charge disclosed before confirmation. The booking response reports any difference from the quoted total.

## Submission material

Provide official square PNG icons, four 706-pixel-wide screenshots, an accessible walkthrough video, a dedicated demo account without MFA and evidence for all cases in test-cases.md. Reviewer credentials and sign-in details are entered only in the secure dashboard. Upload the ZIP with mcp.json, complete the domain challenge and connect the MCP server; do not include .app.json. Keep the production MCP origin unchanged between versions.
