# Dairy Production & Formula Management System

Full MERN stack application for managing dairy production (yogurt, cheese, ice cream, etc.) with recipe versioning, inventory, packaging, and profit calculation.

## Prerequisites

- Node.js (v16+)
- MongoDB Atlas account (or local MongoDB)
- npm or yarn

## Environment Variables

### Server (.env in `server/`)

```
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_super_secret_jwt_key
```

### Client (.env in `client/`)

```
VITE_API_URL=http://localhost:5000/api
```

## Installation

1. Clone the repository.
2. Install backend dependencies:
   ```bash
   cd server
   npm install
   ```
3. Install frontend dependencies:
   ```bash
   cd client
   npm install
   ```
4. Start the backend (development):
   ```bash
   cd server
   npm run dev
   ```
5. Start the frontend (development):
   ```bash
   cd client
   npm run dev
   ```
6. Open `http://localhost:5173` in your browser. The first user to register becomes the **Administrator**.

## Deployment

- **Frontend (Vercel)**: Build with `npm run build` and deploy the `dist` folder.
- **Backend (Render)**: Push to a Git repo and connect Render's automatic deployment.

## Features

- Authentication (JWT) with roles: Admin, Manager, Production Operator, Store Keeper.
- Formula Builder: unlimited recipes, ingredients as % of milk, duplicate, version history, enable/disable.
- Production Calculator: "I Have Milk" and "I Want To Produce" modes, store checker.
- Inventory: stock, low stock alerts, suppliers, unit cost, transaction history.
- Packaging: separate bottle stock (500ml, 1L, 2L, 3L, 5L).
- Profit Calculator: labour, consumables, ingredient cost vs revenue.
- Dashboard: today's production, milk used, low stock alerts, charts.
- Reports: searchable history, daily/weekly/monthly, export to PDF/Excel.
- Global search, settings (company info, units, theme).

## License

MIT
