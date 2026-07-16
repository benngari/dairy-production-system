# DairyFlow — Dairy Production & Formula Management System

A complete, production-ready MERN stack application that lets dairy manufacturers
calculate ingredient quantities automatically from stored formulas. Operators never
calculate percentages manually — the **Dynamic Formula Engine** does it for any
product (Yogurt, Greek Yogurt, Drinking Yogurt, Mala, Fresh Milk, Cheese, Butter,
Cream, Ice Cream, and anything you add later) with **zero code changes**.

## Tech Stack

**Frontend:** React (Vite) · Tailwind CSS · React Router · Axios · React Hook Form · React Icons · Recharts
**Backend:** Node.js · Express.js
**Database:** MongoDB Atlas + Mongoose
**Auth:** JWT + bcrypt
**Deployment:** Vercel (frontend) · Render (backend)

## How the Formula Engine Works

Every recipe stores each ingredient as a **percentage relative to the milk quantity**.
This single rule powers both calculator modes for any product:

- **Mode 1 — "I Have Milk":** enter a milk quantity → every ingredient quantity is
  computed automatically (`ingredient = milk × percentage / 100`), plus the expected
  finished-product yield (`milk × yield% / 100`).
- **Mode 2 — "I Want To Produce":** enter a desired finished-product quantity → the
  engine back-calculates the required milk (`milk = output / (yield% / 100)`) and then
  every ingredient from that milk quantity.

Adding a new product (e.g. Ice Cream) only requires creating a new **Recipe**
document with its own ingredients/percentages/yield — no code changes anywhere.

## Project Structure

```
dairy-app/
├── client/                # React frontend (Vite)
│   └── src/
│       ├── components/    # Reusable UI + modals
│       ├── pages/         # Route-level pages
│       ├── layouts/       # App shell (sidebar/navbar)
│       ├── context/       # Auth + Toast context
│       └── services/      # Axios API client
└── server/                # Express backend
    ├── config/            # MongoDB connection
    ├── controllers/       # Business logic per module
    ├── middleware/         # JWT auth, role guard, error handler
    ├── models/            # Mongoose schemas
    ├── routes/            # Express routers
    └── utils/             # Formula engine, batch numbers, seed script
```

## 1. Prerequisites

- Node.js 18+ and npm
- A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) cluster
  (the app uses a MongoDB session transaction when producing a batch, so make sure
  your Atlas cluster is a replica set — the default Atlas free tier (M0) already is)

## 2. MongoDB Atlas Setup

1. Create a free cluster at MongoDB Atlas.
2. Under **Database Access**, create a database user with a username/password.
3. Under **Network Access**, add your IP (or `0.0.0.0/0` for development/Render).
4. Click **Connect → Drivers**, copy the connection string. It looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/dairy-db?retryWrites=true&w=majority
   ```

## 3. Backend Setup

```bash
cd server
npm install
cp .env.example .env
```

Edit `server/.env`:

```
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/dairy-db?retryWrites=true&w=majority
JWT_SECRET=replace_with_a_long_random_string
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

Optionally seed the database with a default admin user, starter ingredients, and a
sample "Flavored Yogurt" recipe (matches the example calculation in the spec):

```bash
npm run seed
```

This creates:
- Admin login → `admin@dairy.com` / `Admin@123`
- 6 starter ingredients with stock already in inventory
- 1 sample recipe ("Flavored Yogurt")

Alternatively, just register the first account through the UI — the first user to
register is automatically made an **Administrator**.

Run the API:

```bash
npm run dev     # nodemon, auto-restart
# or
npm start       # plain node
```

The API runs on `http://localhost:5000` by default. Health check:
`GET http://localhost:5000/api/health`.

## 4. Frontend Setup

```bash
cd client
npm install
cp .env.example .env
```

Edit `client/.env`:

```
VITE_API_URL=http://localhost:5000/api
```

Run the dev server:

```bash
npm run dev
```

Visit `http://localhost:5173`.

## 5. Roles & Permissions

| Role                 | Recipes | Calculator | Inventory | Reports/History | Users | Settings |
|-----------------------|:-------:|:----------:|:---------:|:----------------:|:-----:|:--------:|
| Administrator         | ✅      | ✅         | ✅        | ✅               | ✅    | ✅       |
| Manager               | ✅      | ✅         | ✅        | ✅               | ❌    | ✅       |
| Production Operator   | view    | ✅         | ❌        | ✅               | ❌    | ❌       |
| Store Keeper          | view    | ❌         | ✅        | ✅               | ❌    | ❌       |

## 6. Core Modules Included

- JWT authentication with role-based access control
- Dashboard: today's production, milk used, inventory summary, low-stock alerts,
  recent batches, weekly milk-usage chart, inventory-by-category chart
- Dynamic Formula Engine + Formula Builder (unlimited recipes/ingredients, duplicate,
  enable/disable, full version history with restore)
- Production Calculator (Mode 1 "I Have Milk" / Mode 2 "I Want To Produce")
- Store Checker (required vs available vs remaining, blocks production on shortage)
- Automatic inventory deduction on production (atomic MongoDB transaction)
- Inventory management (add/edit/delete, search, minimum stock, supplier, full
  transaction history per ingredient)
- Production History with search + date-range filtering and full batch detail view
- Reports: daily/weekly/monthly production, inventory, ingredient consumption,
  low stock — with PDF and Excel export
- Global search across ingredients, recipes, users, and production batches
- Settings (company name, factory name, logo, default unit, theme)

## 7. Deployment

### Backend → Render

1. Push this repository to GitHub.
2. In Render, create a **New Web Service** from the repo, root directory `server`.
3. Build command: `npm install`. Start command: `npm start`.
4. Add environment variables from `server/.env` (`MONGO_URI`, `JWT_SECRET`,
   `JWT_EXPIRE`, `CLIENT_URL`, `NODE_ENV=production`).
5. Deploy. Note the resulting URL, e.g. `https://dairyflow-api.onrender.com`.

### Frontend → Vercel

1. In Vercel, **Import Project** from the same repo, root directory `client`.
2. Framework preset: Vite. Build command: `npm run build`. Output dir: `dist`.
3. Add environment variable `VITE_API_URL=https://dairyflow-api.onrender.com/api`
   (use your Render URL + `/api`).
4. Deploy.
5. Back in Render, update `CLIENT_URL` to your Vercel URL so CORS allows it, then
   redeploy the backend.

## 8. Adding a New Product (Future Proof)

To support a brand-new product (e.g. Ice Cream), simply create a new Recipe in the
Formula Builder with its own ingredients, percentages, and yield %. No backend or
frontend code changes are required — the same calculator, store checker, and
inventory deduction logic automatically applies.

## 9. Opening in VS Code

Unzip the project, open the root folder in VS Code, and open two terminals — one in
`server/` and one in `client/` — and run each `npm run dev` command as described
above.
