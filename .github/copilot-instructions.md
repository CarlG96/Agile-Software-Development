# Leave Booking System

This repository contains the code for the Leave Booking System, which consists of a backend API and a React frontend.

# Architectural Overview

The Leave Booking System is separated into three sections which are defined by separate roles, each governed by JWT-authentication.
The three roles are:

- Staff
- Manager
- Admin

For auth, the provider pattern should be used. On a page hard refresh or on the expiry of a JWT the user should be redirected to the login page.

Errors are returned as JSON or text from the API, depending on endpoint.

## API Endpoints

### Auth

| Method | Endpoint | Description |
|--------|----------|--------------|
| POST | /api/auth/login | Accepts email and password credentials and returns a JWT if valid |

### Staff

| Method | Endpoint | Description |
|--------|----------|--------------|
| POST | /api/staff/me/leave-requests | Creates a new leave request with initial Pending status |
| PATCH | /api/staff/me/leave-requests/:requestId/cancel | Cancels an existing leave request belonging to the authenticated staff member |
| GET | /api/staff/me/leave-requests | Returns all leave requests for the authenticated staff member with their statuses |
| GET | /api/staff/me/leave-balance | Returns remaining/used leave balances for the authenticated staff member |

### Manager

| Method | Endpoint | Description |
|--------|----------|--------------|
| GET | /api/manager/leave-requests/outstanding | Returns pending leave requests for staff assigned to the authenticated manager |
| PATCH | /api/manager/leave-requests/:requestId/approve | Approves a leave request belonging to a member of the manager's team |
| PATCH | /api/manager/leave-requests/:requestId/reject | Rejects a leave request belonging to a member of the manager's team |
| GET | /api/manager/staff/:staffId/leave-balance | Returns remaining leave balance for a staff member under the authenticated manager |

### Admin

| Method | Endpoint | Description |
|--------|----------|--------------|
| POST | /api/admin/staff | Adds a new staff member and creates their default leave balances |
| PATCH | /api/admin/staff/:staffId/profile | Updates the role and/or manager relationship for a staff member |
| GET | /api/admin/leave-requests/outstanding | Returns outstanding leave requests, optionally filtered by staff or manager |
| PATCH | /api/admin/staff/:staffId/leave-allocation | Adjusts a staff member's leave entitlement for a given leave type |
| PATCH | /api/admin/leave-requests/:requestId/approve | Approves a leave request on behalf of a manager |
| GET | /api/admin/analytics/leave-usage | Returns system-wide leave usage analytics |

# WCAG Considerations 

The React frontend for the Leave Booking System must conform to WCAG Level AA.

This will include:

## Level A Guidelines

| Guideline | Description |
|-----------|--------------|
| 1.3.1 | Information, structure, and relationships conveyed through presentation can be programmatically determined or are available in text |
| 1.3.2 | When the sequence in which content is presented affects its meaning, a correct reading sequence can be programmatically determined |
| 1.3.3 | Instructions provided for understanding and operating content do not rely solely on sensory characteristics of components such as shape, color, size, visual location, orientation, or sound |
| 1.4.1 | Color is not used as the only visual means of conveying information, indicating an action, prompting a response, or distinguishing a visual element |
| 2.1.1 | All functionality of the content is operable through a keyboard interface without requiring specific timings for individual keystrokes, except where the underlying function requires input that depends on the path of the user's movement and not just the endpoints |
| 2.1.2 | If keyboard focus can be moved to a component of the page using a keyboard interface, then focus can be moved away from that component using only a keyboard interface, and, if it requires more than unmodified arrow or tab keys or other standard exit methods, the user is advised of the method for moving focus away |
| 2.1.4 | If a keyboard shortcut is implemented in content using only letter (including upper- and lower-case letters), punctuation, number, or symbol characters, then at least one of the following is true: a mechanism is available to turn the shortcut off; a mechanism is available to remap the shortcut to include one or more non-printable keyboard keys (e.g., Ctrl, Alt); or the keyboard shortcut for a user interface component is only active when that component has focus |
| 2.4.1 | A mechanism is available to bypass blocks of content that are repeated on multiple web pages |
| 2.4.2 | Web pages have titles that describe topic or purpose |
| 2.4.3 | If a web page can be navigated sequentially and the navigation sequences affect meaning or operation, focusable components receive focus in an order that preserves meaning and operability |
| 2.4.4 | The purpose of each link can be determined from the link text alone or from the link text together with its programmatically determined link context, except where the purpose of the link would be ambiguous to users in general |
| 3.1.1 | The default human language of each web page can be programmatically determined |
| 3.2.1 | When any user interface component receives focus, it does not initiate a change of context |
| 3.2.2 | Changing the setting of any user interface component does not automatically cause a change of context unless the user has been advised of the behavior before using the component |
| 3.3.1 | If an input error is automatically detected, the item that is in error is identified and the error is described to the user in text |
| 3.3.2 | Labels or instructions are provided when content requires user input |
| 4.1.2 | For all user interface components (including but not limited to: form elements, links and components generated by scripts), the name and role can be programmatically determined; states, properties, and values that can be set by the user can be programmatically set; and notification of changes to these items is available to user agents, including assistive technologies |

## Level AA Guidelines

| Guideline | Description |
|-----------|--------------|
| 1.3.4 | Content does not restrict its view and operation to a single display orientation, such as portrait or landscape, unless a specific display orientation is essential |
| 1.3.5 | The purpose of each input field collecting information about the user can be programmatically determined when: the input field serves a purpose identified in the Input Purposes for user interface components section; and the content is implemented using technologies with support for identifying the expected meaning for form input data |
| 1.4.3 | The visual presentation of text and images of text has a contrast ratio of at least 4.5:1, except for: large-scale text and images of large-scale text (at least 3:1); incidental text or images of text that are part of an inactive user interface component, that are pure decoration, that are not visible to anyone, or that are part of a picture with significant other visual content; and text that is part of a logo or brand name |
| 1.4.4 | Except for captions and images of text, text can be resized without assistive technology up to 200 percent without loss of content or functionality |
| 1.4.10 | Content can be presented without loss of information or functionality, and without requiring scrolling in two dimensions for: vertical scrolling content at a width equivalent to 320 CSS pixels; horizontal scrolling content at a height equivalent to 256 CSS pixels |
| 1.4.11 | The visual presentation of the following have a contrast ratio of at least 3:1 against adjacent color(s): user interface components (visual information required to identify components and states, except inactive components or user-agent-determined appearance not modified by the author); and graphical objects (parts of graphics required to understand the content, except where a particular presentation of graphics is essential to the information being conveyed) |
| 1.4.12 | In content implemented using markup languages that support the following text style properties, no loss of content or functionality occurs by setting all of the following and by changing no other style property: line height to at least 1.5 times the font size; spacing following paragraphs to at least 2 times the font size; letter spacing to at least 0.12 times the font size; word spacing to at least 0.16 times the font size. Exception: human languages and scripts that do not make use of one or more of these text style properties in written text can conform using only the properties that exist for that combination of language and script |
| 1.4.13 | Where receiving and then removing pointer hover or keyboard focus triggers additional content to become visible and then hidden, the following are true: dismissible (a mechanism is available to dismiss the additional content without moving pointer hover or keyboard focus, unless the additional content communicates an input error or does not obscure or replace other content); hoverable (if pointer hover can trigger the additional content, then the pointer can be moved over the additional content without the additional content disappearing); persistent (the additional content remains visible until the hover or focus trigger is removed, the user dismisses it, or its information is no longer valid). Exception: the visual presentation of the additional content is controlled by the user agent and is not modified by the author |
| 2.4.5 | More than one way is available to locate a web page within a set of web pages except where the web page is the result of, or a step in, a process |
| 2.4.6 | Headings and labels describe topic or purpose |
| 2.4.7 | Any keyboard operable user interface has a mode of operation where the keyboard focus indicator is visible |
| 2.4.8 | Information about the user's location within a set of web pages is available |
| 2.4.11 | When a user interface component receives keyboard focus, the component is not entirely hidden due to author-created content |
| 3.1.2 | The human language of each passage or phrase in the content can be programmatically determined except for proper names, technical terms, words of indeterminate language, and words or phrases that have become part of the vernacular of the immediately surrounding text |
| 3.2.3 | Navigational mechanisms that are repeated on multiple web pages within a set of web pages occur in the same relative order each time they are repeated, unless a change is initiated by the user |
| 3.2.4 | Components that have the same functionality within a set of web pages are identified consistently |
| 4.1.3 | In content implemented using markup languages, status messages can be programmatically determined through role or properties such that they can be presented to the user by assistive technologies without receiving focus |

# Security Considerations

The backend API for the Leave Booking System authenticates users through a login endpoint. If the credentials are valid, a JWT is returned containing the user ID, role, manager ID and an eight-hour expiry period.
Depending on the role that is returned from valid credentials in the JWT, the user should either be taken to a staff, manager or admin page. These pages should not be accessible to unauthorised individuals.
After the JWT has expired, any actions taken by the user or any attempts to enter the page should redirect back to the login screen, so that the user must re-enter their credentials to access the page again. The frontend will not implement token refresh.
HTTPS should be used so that credentials and JWTs cannot be intercepted.
The token storage should be in-memory only.


# Responsive Design and Screen Resolutions

The two resolutions used for the Leave Booking System frontend will be:

- 1920×1080 (1080p), because it is common for desktops
- 1366×768, because it is common for laptops

Any of the pages created should conform to the WCAG AA standards within these two resoluton formats.

# Creation of Features and Unit Testing

When called upon, you should only create within the scope assigned for the individual feature that is being discussed (whilst considering the overall architecture and the rules layed out in this document). Whilst generating code for the individual feature, unit tests should also be created along side that feature. These should not be integration tests, which will be handled manually, but should be part of a suite of automated unit tests that mock out the backend and test how the frontend would react in a given situation.

An example of a unit test would be one for a login page, where if the credentials were not valid, the frontend would dsiaply a message informing the user of that.
