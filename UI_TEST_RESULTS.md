# UI fixes and browser verification

- Added a server-synchronized, second-by-second admin countdown with lobby, investigation, final submission, expired, and host-locked labels. The clock remains visible on all host views.
- Fixed low-contrast ghost controls and winner subtitles on paper panels.
- Improved mobile tabs, button wrapping, touch targets, long team names, evidence wrapping, form controls, and contained table scrolling. Expanded the desktop host console.
- Added accessible names to team-name and review-score inputs.
- Team links encode the code and open in a new tab. Added a host link to the join page.
- Added connection-error feedback and recovery for joining, host login/polling/actions, player polling, answers, hints, and reports. Hint/report confirmation respects submission closure.

## Verified

In-app browser, viewport widths 320, 390, 768, and 1440 pixels:

- All four host views: Live scores, Teams, Review, Winners.
- Join page and successful team-code navigation to player screen.
- Finished player screen, reveal, and all five expanded puzzle envelopes.
- No document-level horizontal overflow in these 24 combinations; wide host tables scroll within their panels.
- Winner reveal controls show third, second, and first place.
- Admin clock visibly updates between observations.
- Team-link destination and new-tab attributes checked.
- No browser warnings/errors in the inspected player session.
- Production build and TypeScript checks passed.

## Limits

This verifies one browser engine at representative widths. Physical devices, Safari/Firefox, fresh lobby/report-form screenshots, offline recovery simulation, and every possible input/content combination have not been independently exercised. Existing event scores and the host lock were retained.
