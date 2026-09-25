# Architecture — EasyBusy Connect

## High-level structure

The project is a monorepo with two independent applications:

- `client`: React single-page application
- `server`: Express REST API connected to MongoDB

The browser never connects directly to MongoDB. It sends HTTP requests to the API, and the API validates permissions before accessing the database.

## Stage 1 request flow

```text
React form
   ↓ jQuery Ajax request
Express route
   ↓ Request validation
Auth controller
   ↓ Mongoose model
MongoDB
```

## Stage 2 user flow

The `User` model also holds optional business information. This keeps the final
project focused on exactly three main MongoDB models: User, Post and
Appointment. A business owner is still a user, so a separate Business model
would duplicate identity, login and contact fields.

```text
Profile or discovery page
   ↓ jQuery Ajax request with JWT
User route
   ↓ Authentication and validation middleware
User controller
   ↓ Mongoose query or update
User model in MongoDB
```

User endpoints:

- `POST /api/auth/register`: create a user.
- `GET /api/users`: list and search users or businesses.
- `GET /api/users/:userId`: display a public profile.
- `PATCH /api/users/me`: update the signed-in user's profile.
- `DELETE /api/users/me`: delete the signed-in user after password verification.

## Stage 3 post flow

The `Post` model stores community content and an optional image or video URL.
Every post references its author with a MongoDB ObjectId. The controller
populates only the safe public author fields before returning a response.

Post endpoints:

- `POST /api/posts`: publish a post.
- `GET /api/posts`: list and search the feed.
- `GET /api/posts/:postId`: read one post.
- `PATCH /api/posts/:postId`: update a post owned by the signed-in user.
- `DELETE /api/posts/:postId`: delete a post owned by the signed-in user.

The feed search accepts keyword, category, start date and end date. Together
with the business search, this completes the two required multi-parameter
searches.

## Stage 4 appointment flow

`Appointment` is the third main MongoDB model. It references one customer and
one business owner, and stores a snapshot of the selected service. Keeping a
snapshot means that an existing appointment still shows the original service
name, duration and price if the business later edits its service list.

```text
Customer chooses a service and time
   ↓ jQuery Ajax POST request with JWT
Appointment route validates the input
   ↓ Appointment controller checks roles and time conflicts
Appointment model stores the request in MongoDB
   ↓
Business owner confirms or declines the request
```

Appointment endpoints:

- `POST /api/appointments`: customer creates an appointment request.
- `GET /api/appointments`: list and search the signed-in user's appointments.
- `GET /api/appointments/:appointmentId`: read one participating appointment.
- `PATCH /api/appointments/:appointmentId`: edit time/note or change status.
- `DELETE /api/appointments/:appointmentId`: delete a terminal appointment.

The list endpoint automatically limits results by role: customers see only
their own bookings, while business owners see only bookings made with their
business. Search accepts service, status, start date and end date.

Before creating or rescheduling an active appointment, the controller checks
whether its time interval overlaps another pending or confirmed appointment
for either the customer or the business. Two intervals overlap when the new
start is earlier than an existing end and the new end is later than an existing
start.

## Stage 5 real-time chat flow

The chat uses Socket.io over the same HTTP server as Express. The client sends
its JWT during the Socket.io handshake. The server verifies that token, loads
the user and joins the connection to a private room named with the user id.

```text
React chat composer
   ↓ Socket.io chat:send event + JWT-authenticated connection
Socket handler validates recipient, roles and content
   ↓ Message model
MongoDB persists the message
   ↓ Socket.io rooms
Both participants receive chat:message immediately
```

REST endpoints complement the live connection:

- `GET /api/messages/conversations`: list existing conversations.
- `GET /api/messages/with/:userId`: load or search one conversation.
- `PATCH /api/messages/:messageId`: edit a message owned by the sender.
- `DELETE /api/messages/:messageId`: delete a message owned by the sender.

Message creation itself travels through Socket.io, fulfilling the real-time
WebSocket requirement. Updated and deleted messages are also broadcast to both
participants so two open browsers stay synchronized.

## Stage 6 D3 statistics flow

The statistics page contains two separate SVG visualizations created directly
with D3.js: an appointment-status donut chart and a monthly-activity bar chart.
No chart values are hard coded.

```text
React statistics page
   ↓ GET /api/stats/appointments?months=6
Authenticated statistics controller
   ↓ MongoDB aggregation pipelines
Role-filtered appointment counts
   ↓ D3 scales, axes, arcs and SVG elements
Two responsive visualizations
```

The server selects a different participant field according to the signed-in
role. Customers receive statistics only for appointments they booked; business
owners receive statistics only for appointments at their business. The status
aggregation covers all records, while the monthly aggregation accepts a range
of 3, 6 or 12 months.

The donut chart uses `d3.pie` and `d3.arc` for a part-to-whole view. The bar
chart uses band and linear scales together with D3 axes. Both charts handle an
empty database without invalid SVG values or page errors.

## Stage 7 jQuery Ajax and CSS3 flow

The shared client API service uses `$.ajax` for every REST request. It adds the
JWT header, serializes JSON request bodies, sends query parameters and converts
jQuery callbacks into Promises. The small compatibility response object keeps
the React pages focused on their own state instead of the Ajax implementation.

```text
React View
   ↓ api.get / api.post / api.patch / api.delete
Shared jQuery $.ajax service
   ↓ Authorization header + JSON
Express REST API
```

The reusable `useJQueryReveal` hook demonstrates scoped jQuery DOM work in the
business directory, community feed, appointments page and statistics page. It
uses jQuery selection and class operations only inside a React `ref`; React
continues to own creation and removal of every element.

The CSS3 checklist is visible in the interface:

- `text-shadow`: main page titles.
- `transition`: buttons, logo and jQuery-revealed cards.
- `multiple-columns`: the home-page community explanation.
- `font-face`: the local EasyBusy text face used by that explanation.
- `border-radius`: cards, buttons, badges and the multi-column panel.

## Stage 8 defense preparation

The demo seed is an explicit development command, not an API endpoint. It can
run only when `ALLOW_DEMO_SEED=true` and refuses to run in production. The
password comes from `DEMO_PASSWORD`, so no usable credential is committed.

```text
npm run seed
   ↓ safety checks
Upsert three dedicated demo users
   ↓ remove records involving demo users only
Create services, posts, appointments and messages
```

Running the command again produces a predictable demo state without creating
duplicates. It never removes a normal user, normal post or normal appointment.

Logout now clears the session and navigates directly to `/login`. This avoids
React Router preserving a private `/chat/:userId` location and prevents a
different account from requesting the previous account's conversation after
login.

On successful login, the server signs a JWT containing only the user's database identifier. The client stores the token and sends it in the `Authorization` header when requesting a protected resource.

## Server responsibilities

- `models`: database schema and model behavior
- `controllers`: business logic and HTTP responses
- `routes`: URL definitions and validation rules
- `middleware`: authentication, validation and error handling
- `config`: external service configuration

## Security decisions

- Passwords are hashed with bcrypt before saving.
- Password fields are excluded from normal database queries.
- Public user responses are built explicitly and never include a password.
- JWT secrets and database credentials exist only in `.env`.
- Registration permits only customer and business-owner roles.
- Directory responses never expose email addresses or password hashes.
- A user can update or delete only their own record.
- Account deletion requires the current password.
- Post update and deletion compare the author id to the signed-in user id.
- Appointment operations verify that the signed-in user is the customer or
  business participant and apply different role-based actions.
- Socket connections authenticate with JWT before joining a private user room.
- Customers and business owners may chat with each other, but not access a
  conversation in which they do not participate.
- Deleting an account also removes authored posts, participating appointments
  and sent or received messages.
- Authentication endpoints use rate limiting.
- Helmet adds common HTTP security headers.
- Error responses use a consistent shape.
