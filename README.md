# EasyBusy Connect

EasyBusy Connect is a social platform for local businesses and customers. Businesses can build a community, publish content and manage appointments. Customers can discover businesses, follow updates, book services and chat in real time.

## Current status

The completed milestones include:

- React and Vite client
- Express and MongoDB server
- Secure registration and login
- JWT authentication
- Protected profile page
- Central validation and error handling
- Environment-variable configuration
- Complete User CRUD through the interface
- Personal and business profile editing with a dynamic services list
- Business directory with keyword, city and category search
- Privacy-safe public business profile pages
- Community feed with complete Post CRUD
- Post search by keyword, category and date range
- Image and video post rendering
- Canvas API logo drawn by a React component
- Customer appointment booking from a published service
- Business appointment confirmation, decline, cancellation and completion
- Appointment search, rescheduling, deletion and overlap prevention
- Authenticated real-time chat with Socket.io
- Persistent message history, search, editing and deletion
- Two dynamic D3.js appointment charts backed by MongoDB aggregations
- jQuery Ajax used by the shared API layer for all REST requests
- Scoped jQuery View transitions for dynamic business, post, appointment and statistics cards
- All required CSS3 features: text shadow, transitions, multiple columns, font face and border radius
- Safe, repeatable demo-data seed for defense preparation
- Logout navigation that prevents a new account from reopening another user's chat URL

Progress is tracked in [`docs/requirements-map.md`](docs/requirements-map.md).

## Project structure

```text
EasyBusy-Connect/
├── client/     React application
├── server/     Express REST API
├── docs/       Architecture and requirement tracking
└── README.md
```

## Requirements

- Node.js 18.18 or newer
- A local MongoDB installation or a MongoDB Atlas connection string

## Setup

1. Install all dependencies from the project root:

   ```bash
   npm install
   ```

2. Copy the environment examples:

   ```bash
   copy server\.env.example server\.env
   copy client\.env.example client\.env
   ```

3. Update `server/.env` with your own MongoDB connection string and a long private JWT secret.

4. Start the client and server together:

   ```bash
   npm run dev
   ```

5. Open `http://localhost:5173`.

## Optional demo data

The demo seed creates three dedicated accounts together with businesses,
services, posts, appointments and chat history. It replaces records belonging
to those demo accounts only; normal users and their content are not removed.

1. Add a private local password to `server/.env` and temporarily enable the seed:

   ```env
   ALLOW_DEMO_SEED=true
   DEMO_PASSWORD=your-private-demo-password
   ```

2. Run the seed once from the project root:

   ```bash
   npm run seed
   ```

3. Set `ALLOW_DEMO_SEED=false` again after the data is created.

The command prints the three demo email addresses. Their shared password is
read from `DEMO_PASSWORD` and is never stored in Git.

## Useful commands

```bash
npm run dev
npm run seed
npm run build
npm run lint
npm run check
```

Never commit `.env` files or real credentials.
