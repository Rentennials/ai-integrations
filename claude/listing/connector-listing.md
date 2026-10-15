# Rentennials connector listing

Material for the connector directory form and the plugin listing. Reviewer credentials never go in this repository.

## Server

- Server name: Rentennials
- Server URL: https://mcp.rentennials.app/mcp
- Transport: Streamable HTTP
- Website: https://www.rentennials.app
- Support: https://www.rentennials.app/contact
- Privacy policy: https://rentennials.app/privacy-policy
- Terms: https://www.rentennials.app/terms-and-conditions

## One-liner

Find, compare and request rental cars from private owners in Argentina, the United States, Mexico and Peru.

## Description

Find cars on Rentennials in Argentina, the United States, Mexico and Peru. Compare vehicles, pickup options, owner conditions and quotes with coverages and extras. Connect your account to see your trips and request a booking after explicitly confirming its price and dates. Some vehicles require owner approval and others immediate payment. Payment happens on a secure Rentennials-hosted page outside the conversation. Flights, in-chat card payments and booking cancellations are outside this connector's scope.

## Categories

- Travel
- Shopping / Commerce

## Use cases

1. Find a rental car in a city for specific dates and pickup points.
2. Compare quotes with coverages and extras before choosing.
3. Request a booking after confirming its price and dates.
4. Review the status of your Rentennials bookings.
5. Get a payment link for an approved booking. Payment completes outside the chat.

## Prerequisites

A Rentennials account, signed in with Google or Facebook, is needed only for your profile and bookings. Search, locations and quotes work without an account.

## Data access

Reads and writes data. Reads the catalog, your profile and your bookings. Writes profile fields, booking requests, owner messages and payment sessions.

## Authentication

OAuth 2.1 with client ID metadata documents (CIMD) and dynamic client registration (DCR). Public tools work without login (lazy authentication); profile and booking tools ask the user to sign in when needed.

## Allowed link URIs

- https://www.rentennials.app
- https://rentennials.app

## Screenshots

Files in `claude/listing/screenshots/`, 1000 px wide.

| File | Shows | Suggested prompt |
| --- | --- | --- |
| screenshot-1.png | Vehicle results carousel | "Find me a car in Mendoza for two days next week" |
| screenshot-2.png | Rental summary after choosing a car | Choose a vehicle in the results |
| screenshot-3.png | Rental summary, coverage tab | Same flow as screenshot 2, then open the coverage tab |
| screenshot-4.png | Results sorted by price | "Sort them from cheapest to most expensive" |

## Tools

Access follows the permissions in `openai/listing.md`.

| Tool | Access | Purpose |
| --- | --- | --- |
| ping | Read | Anonymous connection diagnostic: server status and time |
| get_auth_status | Read | Connection state and granted scopes; no credentials returned |
| get_current_user | Read | Connected user's profile and missing payment fields |
| update_current_user | Write | Saves the supported profile fields the user asks to change |
| list_locations | Read | Public catalog of rental locations |
| list_meeting_points | Read | Public catalog of pickup and return points |
| search_vehicles | Read | Public vehicle search, shown as a results carousel |
| get_vehicle | Read | Public vehicle details, features and owner conditions |
| get_vehicle_quote | Read | Price for exact dates; no reservation or charge |
| show_rental_summary | Read | Editable rental summary; no reservation or charge |
| list_bookings | Read | The connected user's bookings |
| get_booking | Read | One of the user's bookings, ownership enforced |
| create_booking_request | Write | Creates a booking request after explicit confirmation |
| update_owner_message | Write | Replaces the user's own note on their booking |
| pay_booking | Write | Creates a payment session and returns an external payment link |

## Reviewer notes

- TODO: demo account credentials go only in the portal form, never in this repository.
- Use future available dates when testing.
- The case list in `openai/test-cases.md` applies to Claude as well. Claude runs are not executed yet.
- The screenshots come from a synthetic harness with fallback fonts. They are not evidence from a real Claude session.
