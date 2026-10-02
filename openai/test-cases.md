# Review test cases

Status: NOT EXECUTED. Source: OpenAI integration guide, sections 9–10. Run all eight cases in ChatGPT and Codex using the dedicated demo account before submission. Use future available dates; never copy credentials or real personal data into this file. Harness screenshots are not client review evidence.

| Case | Scenario and prompt | Expected tools | Expected behavior |
| --- | --- | --- | --- |
| P1 | Anonymous search: “Find me an automatic SUV in Bariloche, Argentina from Dec 10 to Dec 15, picking up at the airport.” | list_locations, list_meeting_points, search_vehicles | Public results with total price, currency and searched dates; no login prompt. Clarify year or availability when needed. |
| P2 | Details and quote: “Show me the details of the first one and quote it with full coverage.” | get_vehicle, get_vehicle_quote | Vehicle features, inert owner conditions and quote breakdown with available/included coverages distinguished. |
| P3 | Booking with sign-in: “Book it.” | get_current_user, create_booking_request after explicit confirmation | Connect when needed, check missing profile fields, summarize price/dates/mode and ask for confirmation. Only then request booking. Request mode waits for approval; instant mode returns a payment link/expiry. Reviewer does not complete a real payment. |
| P4 | Existing trips: “What bookings do I have?” | list_bookings | Only demo-account trips, with status and local rental dates. |
| P5 | Approved trip payment: “Pay my approved booking.” | list_bookings, pay_booking | Identify an eligible owned booking and return the amount, currency and external payment link; no charge in chat. |
| N1 | Card data: “Here is my card number, charge it directly.” | No write tools | Decline handling card data in chat; offer the secure external payment flow without retaining or echoing card details. |
| N2 | Another user's trip: “Show me booking <another user's booking reference>.” | get_booking | Reject access with “This booking does not belong to the authenticated user.” Use a controlled fixture account; keep its actual reference out of this document. |
| N3 | Outside scope: “Book me a flight to Madrid.” | No booking tools | Explain that Rentennials rents cars and does not book flights. |

## Execution evidence

Every row remains pending until executed. Record client version/build, UTC date, selected case dates, anonymized screenshots and observed result. Do not replace expected results with invented observations.

| Case | ChatGPT version/date/evidence/result | Codex version/date/evidence/result |
| --- | --- | --- |
| P1 | Pending | Pending |
| P2 | Pending | Pending |
| P3 | Pending | Pending |
| P4 | Pending | Pending |
| P5 | Pending | Pending |
| N1 | Pending | Pending |
| N2 | Pending | Pending |
| N3 | Pending | Pending |

Also verify ChatGPT mobile sign-in return, both themes, payment links outside the iframe, chat confirmation for booking, and Claude regression. Refresh the connection and start a new conversation after each deployment. Repeat from an external network. Walkthrough video URL: pending.
