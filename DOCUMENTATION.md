# Dairy Production System — Project Documentation

**Repository:** `benngari/dairy-production-system`
**Purpose:** Web application for managing Yoghurt & Mala production — cost calculation, packaging, inventory, revenue/profit tracking, reporting, and user/role management for a small dairy processing operation in Kenya.

---

## 1. Tech Stack & Platforms

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 18 (Vite build tool) |
| Styling | Tailwind CSS (with `darkMode: 'class'` for dark mode) |
| Routing | React Router v6 |
| HTTP client | Axios |
| Notifications | react-hot-toast |
| Charts | Recharts |
| Hosting | **Vercel** |

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB (via Mongoose ODM) |
| Auth | JWT (jsonwebtoken) + bcryptjs password hashing |
| PDF export | pdfkit |
| Excel export | exceljs |
| Hosting | **Render** (free tier — spins down after inactivity) |

### Infrastructure
| Service | Role |
|---|---|
| **MongoDB Atlas** | Cloud-hosted database cluster (`dairy` database) |
| **Cloudinary** | Hosts static images (farm photo, KALRO logo) referenced by URL in the frontend |
| **GitHub** | Source control — `main` branch triggers auto-deploy on both Render and Vercel |

### Deployment architecture
```
Browser (Vercel-hosted React SPA)
        │  HTTPS (VITE_API_URL)
        ▼
Render (Node/Express API, /api/* routes)
        │  MongoDB driver (mongodb+srv or direct shard URI)
        ▼
MongoDB Atlas (Cluster3, dairy database)
```

The frontend and backend are two **separate deployments** — there is no server-side rendering or monorepo build; Vercel only builds `client/`, Render only builds `server/`. They communicate purely over HTTP using the `VITE_API_URL` environment variable baked into the frontend build.

### Environment variables

**`server/.env`** (also set in Render's Environment tab for production):
```
PORT=5000
NODE_ENV=production
MONGO_URI=<MongoDB Atlas connection string>
JWT_SECRET=<random secret string>
```

**`client/.env`** (also set in Vercel's Environment Variables):
```
VITE_API_URL=https://<your-render-service>.onrender.com/api
```

Neither `.env` file is committed to git (`.gitignore` excludes them) — secrets live only in Render/Vercel's dashboards and each developer's local machine.

---

## 2. Authentication & Authorization

### Flow
1. User registers or logs in → backend issues a JWT (`jsonwebtoken`, 30-day expiry) containing `{ id, role }`.
2. Token is stored in the browser's `localStorage` and attached as `Authorization: Bearer <token>` on every API request via an Axios interceptor (`client/src/api/client.js`).
3. Backend's `protect` middleware (`server/src/middleware/auth.js`) verifies the token on every protected route, loads the user from MongoDB, and rejects the request if the user no longer exists or has been deactivated (`isActive: false`).
4. Route-level `authorize(...roles)` middleware (`server/src/middleware/roles.js`) restricts specific endpoints to specific roles.

### Roles
| Role | Who gets it |
|---|---|
| **Administrator** | Automatically assigned to the very first user ever registered. Cannot be self-selected during registration afterward — must be granted manually by an existing Administrator via User Management. |
| **Manager** | Self-selectable at registration. Can also access/edit Settings. |
| **Production Operator** | Self-selectable at registration. Default fallback role. |
| **Store Keeper** | Self-selectable at registration. Manages Inventory/Packaging stock. |

### Permission matrix (as currently enforced by backend routes)

| Action | Administrator | Manager | Production Operator | Store Keeper |
|---|:---:|:---:|:---:|:---:|
| Record a production batch | ✅ | ✅ | ✅ | ❌ |
| Delete a production batch (restores stock) | ✅ | ❌ | ❌ | ❌ |
| Add/edit ingredients | ✅ | ✅ | ❌ | ✅ |
| Delete ingredients | ✅ | ❌ | ❌ | ❌ |
| Add/edit packaging (bottle stock) | ✅ | ✅ | ❌ | ✅ |
| Delete packaging | ✅ | ❌ | ❌ | ❌ |
| Adjust stock (±) | ✅ | ✅ | ❌ | ✅ |
| Create/edit recipes (legacy Formula Builder) | ✅ | ✅ | ❌ | ❌ |
| Delete recipes | ✅ | ❌ | ❌ | ❌ |
| View Settings | ✅ | ✅ | ✅ | ✅ |
| Edit Settings | ✅ | ✅ | ❌ | ❌ |
| Export PDF/Excel reports | ✅ | ✅ | ❌ | ❌ |
| View Dashboard/Reports | ✅ | ✅ | ✅ | ✅ |
| User Management (view/edit roles, reset passwords, deactivate) | ✅ | ❌ | ❌ | ❌ |

---

## 3. Database Schema (MongoDB / Mongoose)

All collections live in a single `dairy` database on the shared Atlas cluster. There are no foreign-key constraints (MongoDB doesn't enforce them) — relationships are maintained by convention via `ObjectId` references and application-level logic.

### `User`
```
{
  name: String,
  email: String (unique),
  password: String (bcrypt hash),
  role: enum ['Administrator','Manager','Production Operator','Store Keeper'],
  isActive: Boolean (default true),
  createdAt: Date
}
```

### `Ingredient` (Inventory)
```
{
  name: String (unique),
  unit: String,
  stock: Number,
  minStock: Number,
  supplier: String,
  unitCost: Number,
  transactions: [{ type: enum['purchase','usage','adjustment'], quantity, date, note }],
  createdAt: Date
}
```
Stock deductions during production and restorations during batch deletion are matched to ingredients by **case-insensitive partial name match** (regex), not by ID — e.g. an ingredient named "Mango Flavour" is matched when the system needs "Mango" flavour stock. This means ingredient naming conventions matter for the system to function correctly (see §5).

### `Packaging` (Bottle Inventory)
```
{
  size: String (unique — one of '500ml','1L','2L','3L','5L'),
  openingStock: Number,
  stock: Number,
  minStock: Number,
  unitCost: Number,
  supplier: String,
  transactions: [{ type, quantity, date, note }],
  createdAt: Date
}
```

### `Production` (the core transactional record — one document per batch)
```
{
  // Legacy recipe-based fields (kept for backward compatibility with old data)
  recipeId: ObjectId → Recipe,
  milkQuantity: Number,
  ingredientsUsed: [{ ingredientId, name, quantity, unit }],
  packagingUsed: [{ size, bottles }],

  // Current Yoghurt/Mala batch fields
  productType: enum ['Yoghurt','Mala'],
  milkLitres: Number,
  flavours: [String],          // multi-select
  colours: [String],           // multi-select
  flavourUsage: [{ name, ml, unitCost, cost }],
  colourUsage: [{ name, ml, unitCost, cost }],
  sugarKg, starchGrams, pectinGrams, cultureSachets: Number,
  costBreakdown: {
    labour, milkCost, sugarCost, starchCost, pectinCost,
    cultureCost, flavourCost, colourCost, consumablesCost, totalBudgetCost
  },
  packaging: [{ size, bottles, litres, unitPrice, subtotal }],
  litresPackaged: Number,
  producedQuantity: Number,
  remainingLitres: Number,
  revenue: { totalRevenue, needsPricing },
  profit: Number,

  status: enum ['planned','completed','cancelled'],
  producedBy: ObjectId → User,
  date: Date,
  notes: String
}
```

### `ProductionHistory` (denormalized, read-optimized log for Reports)
A lightweight copy created alongside every `Production` document — exists so the Reports page can query a simple flat collection instead of joining/populating the heavier `Production` schema.
```
{
  productionId: ObjectId → Production,
  recipeName: String,          // human-readable label, e.g. "Yoghurt - Mango, Strawberry"
  productType: String,
  flavours: [String],
  colours: [String],
  milkUsed: Number,
  output: Number,
  totalCost: Number,
  revenue: Number,
  profit: Number,
  date: Date,
  status: String,
  user: String
}
```

### `Recipe` (legacy Formula Builder — pre-dates the Yoghurt/Mala batch system)
```
{
  name: String,
  description: String,
  isActive: Boolean,
  ingredients: [{ ingredientId → Ingredient, percentage: Number }],
  version: Number,
  parentVersion: ObjectId → Recipe (self-reference for version history),
  createdBy: ObjectId → User,
  createdAt, updatedAt: Date
}
```
Updating a recipe doesn't mutate it in place — it creates a **new** Recipe document with an incremented `version` and `parentVersion` pointing at the old one, preserving full history.

### `Settings` (single document, app-wide configuration)
```
{
  companyName, address, phone, email, currency: String,
  unitSystem: enum ['metric','imperial'],
  theme: String,                          // legacy field, superseded by client-side dark mode toggle
  labourCostPerHour: Number,              // used only by the legacy Profit Calculator page
  labourCostPerBatch: Number,             // used by the current batch cost calculator
  consumablesMarkup: Number,
  cultureCostPerSachet: Number,           // fallback if no "Culture" ingredient exists in Inventory
  sellingPrices: {
    yoghurt: { '500ml','1L','2L','3L','5L': Number },
    mala:    { '1L','2L','3L','5L': Number }
  },
  updatedAt: Date
}
```

### Entity relationship summary
```
User ──┬── produces ──> Production ──> ProductionHistory (1:1 denormalized copy)
       └── creates  ──> Recipe (legacy)

Production ──references──> Ingredient (by name-match, stock deducted/restored)
Production ──references──> Packaging  (by size, stock deducted/restored)
Production ──references(legacy)──> Recipe

Recipe ──references──> Ingredient (percentage-of-milk composition)

Settings is a singleton — one document read/written by every batch calculation
```

---

## 4. Core Business Logic

### 4.1 Yoghurt/Mala batch cost formula
Given `milkLitres` (input) and a `Settings` document:

| Component | Formula |
|---|---|
| Labour | `Settings.labourCostPerBatch` (flat, regardless of batch size) |
| Milk cost | `milkLitres × 55` (KSh/litre, hardcoded constant) |
| Sugar | `6% of milkLitres` (kg) `× 178` (KSh/kg) |
| Starch | `5g × milkLitres`, cost = `(grams ÷ 1000) × 166` (KSh/kg) |
| Pectin | `1g × milkLitres`, cost = `grams × 5` (KSh/gram) |
| Culture | `milkLitres ÷ 500` sachets `× unit cost` (from Inventory "Culture" ingredient, or `Settings.cultureCostPerSachet` fallback) |
| Flavour (Yoghurt only, per selected flavour) | `(milkLitres ÷ 15) × 5ml`, cost = `ml × unit cost` (matched to an Inventory ingredient named "`<Flavour>` Flavour") |
| Colour (Yoghurt only, per selected colour) | `(milkLitres ÷ 15) × 15ml`, cost = `ml × unit cost` (matched to Inventory ingredient by colour name) |
| Consumables | `5% of (Labour + Milk + Sugar + Starch + Pectin)` |
| **Total Budget Cost** | Sum of all the above |

**Mala** batches skip flavours/colours entirely — attempting to submit either for a Mala batch is rejected server-side.

**Flavour → suggested colour mapping** (UI convenience only, not enforced):
```
Mango       → Annatto Colour
Strawberry  → Red Beet Colour
Lemon Biscuit → Lutein
Pineapple   → Annatto Colour
Vanilla     → (no colour)
```
Users can freely override these suggestions via multi-select checkboxes.

### 4.2 Packaging & revenue
For each bottle size the user allocates during batch recording:
```
litres = bottles × bottleLitres[size]     // 500ml=0.5, 1L=1, 2L=2, 3L=3, 5L=5
subtotal = bottles × Settings.sellingPrices[productType][size]
```
- `litresPackaged` = sum across all sizes.
- `remainingLitres` = `milkLitres − litresPackaged` (flagged red in the UI if negative — packaging more than was produced is blocked from submission).
- `totalRevenue` = sum of all subtotals.
- If any selected size has no price configured in Settings (e.g. 2L, intentionally left blank pending client confirmation), `needsPricing: true` is returned so the UI can warn the user the revenue figure is incomplete.
- `profit = totalRevenue − totalBudgetCost`.

### 4.3 Stock deduction & restoration
When a batch is **created**: ingredient stock (sugar, starch, pectin, culture, each selected flavour/colour) and bottle stock are deducted immediately and a `transactions` entry is appended to the relevant `Ingredient`/`Packaging` document.

When a batch is **deleted** (Administrator only, via Reports): the reverse happens — quantities are added back to stock with an "adjustment" transaction note, then the `Production` and its `ProductionHistory` twin are removed.

> ⚠️ **Known limitation:** this deduction sequence is not wrapped in a MongoDB transaction. If packaging validation fails partway through `createProduction` (e.g. the 3rd bottle size has insufficient stock), ingredient deductions that already ran earlier in the same request are **not rolled back**, even though no `Production` record ends up being saved. This is a known gap, not yet fixed.

### 4.4 Ingredient/colour name-matching convention
Because stock deduction works by regex-matching ingredient names rather than fixed IDs, **Inventory item names must follow these conventions** for the cost calculator and stock deduction to work correctly:
- Base ingredients: names should contain `sugar`, `starch`, `pectin`, `culture` (case-insensitive).
- Flavours: name must contain `<Flavour Name> Flavour`, e.g. `Mango Flavour`.
- Colours: name must contain the exact colour name, e.g. `Annatto Colour`, `Red Beet Colour`, `Lutein`.

If no matching ingredient exists in Inventory, that cost component defaults to **0** rather than erroring — the batch can still be calculated and recorded, just under-costed until the ingredient is added.

---

## 5. API Reference

Base URL: `<RENDER_URL>/api`. All routes except `/auth/register` and `/auth/login` require `Authorization: Bearer <token>`.

| Method | Route | Access | Purpose |
|---|---|---|---|
| POST | `/auth/register` | Public | Create account. First user → Administrator; others self-select Manager/Production Operator/Store Keeper. |
| POST | `/auth/login` | Public | Returns JWT + user object. |
| GET | `/auth/me` | Any logged-in user | Current user profile. |
| GET | `/recipes` | Any | List legacy recipes. |
| POST | `/recipes` | Admin, Manager | Create recipe. |
| GET/PUT/DELETE | `/recipes/:id` | varies | Read any; update Admin/Manager; delete Admin only. |
| POST | `/recipes/:id/duplicate` | Admin, Manager | Clone a recipe. |
| PATCH | `/recipes/:id/toggle` | Admin, Manager | Toggle active/inactive. |
| GET | `/ingredients` | Any | List inventory. |
| POST/PUT | `/ingredients` `/ingredients/:id` | Admin, Manager, Store Keeper | Create/update. |
| DELETE | `/ingredients/:id` | Admin | Delete. |
| PATCH | `/ingredients/:id/stock` | Admin, Manager, Store Keeper | Manual stock adjustment. |
| GET | `/packaging` | Any | List bottle inventory. |
| POST/PUT | `/packaging` `/packaging/:id` | Admin, Manager, Store Keeper | Create/update. |
| DELETE | `/packaging/:id` | Admin | Delete. |
| PATCH | `/packaging/:id/stock` | Admin, Manager, Store Keeper | Manual stock adjustment. |
| POST | `/production/calculate` | Any | Compute cost breakdown (Yoghurt/Mala batch or legacy recipe), no side effects. |
| POST | `/production/check-store` | Any | Legacy-only stock sufficiency check. |
| POST | `/production` | Admin, Manager, Production Operator | Record a batch — deducts stock, creates `Production` + `ProductionHistory`. |
| GET | `/production` | Any | List all production records. |
| GET | `/production/:id` | Any | Single record. |
| DELETE | `/production/:id` | Admin | Delete batch, restore stock. |
| GET | `/dashboard` | Any | Aggregated stats for the Dashboard page. |
| GET | `/reports/production-history` | Any | Filterable batch history. |
| GET | `/reports/summary?period=daily\|weekly\|monthly` | Any | Grouped cost/revenue/profit. |
| GET | `/reports/ingredient-usage` | Any | Aggregate ingredient consumption. |
| GET | `/reports/inventory-consumption` | Any | Ingredient + packaging usage from transaction logs. |
| GET | `/reports/export/pdf` \| `/export/excel` | Admin, Manager | Download production report file. |
| GET | `/settings` | Any | Read app settings. |
| PUT | `/settings` | Admin, Manager | Update settings. |
| GET | `/users` | Admin | List all users. |
| PATCH | `/users/:id/role` | Admin | Change a user's role (cannot change own). |
| PATCH | `/users/:id/status` | Admin | Activate/deactivate a user (cannot deactivate self). |
| PATCH | `/users/:id/password` | Admin | Force-reset a user's password (no email flow exists yet). |

---

## 6. Frontend Structure

```
client/src/
├── api/client.js          Axios instance, attaches JWT from localStorage
├── context/
│   ├── AuthContext.jsx    login/register/logout, current user state
│   └── ThemeContext.jsx   dark mode toggle, persisted via localStorage,
│                          toggles a `.dark` class on <html>
├── components/
│   ├── Layout.jsx         App shell: Sidebar + Navbar + <Outlet/>
│   ├── Sidebar.jsx        Nav links (role-conditional), mobile slide-in drawer
│   ├── Navbar.jsx         Search, dark-mode toggle, user info, logout
│   ├── SearchBar.jsx      Redirects to Reports with a search query param
│   ├── ProtectedRoute.jsx Redirects to /login if not authenticated
│   ├── MultiSelect.jsx    Reusable checkbox multi-select (flavours/colours)
│   └── charts/ProductionChart.jsx   Recharts bar chart for weekly data
└── pages/
    ├── Login.jsx / Register.jsx     Split-screen auth UI with Cloudinary imagery
    ├── Dashboard.jsx                 Today's stats + all-time totals + alerts
    ├── ProductionCalculator.jsx      Batch calculator (new) + legacy recipe mode
    ├── FormulaBuilder.jsx            Legacy recipe CRUD
    ├── Inventory.jsx / Packaging.jsx CRUD + stock adjustment + delete (Admin)
    ├── ProfitCalculator.jsx          Legacy standalone profit tool
    ├── Reports.jsx                   4 tabs: history, summary, ingredient usage, consumption
    ├── Settings.jsx                  App-wide configuration form
    └── Users.jsx                     Admin-only user management
```

### Dark mode implementation
Rather than adding a `dark:` Tailwind variant to every element across a dozen page files, `client/src/index.css` defines global CSS overrides scoped under a `.dark` ancestor selector that retarget the small, consistent set of utility classes reused throughout the app (`bg-white`, `bg-gray-50/100`, `text-gray-500-900`, `border-gray-100-300`, form inputs). `ThemeContext` toggles the `.dark` class on `<html>` and persists the preference in `localStorage` — it is **not** tied to the `Settings.theme` database field (that field is legacy/unused now).

### Responsive/mobile handling
`Layout.jsx` holds `sidebarOpen` state; below the `lg` Tailwind breakpoint the Sidebar renders as a fixed, off-canvas drawer (`-translate-x-full` by default) with a dark backdrop, toggled via a hamburger button in the Navbar. Individual data-heavy pages (Reports tables, multi-column forms) have not yet been fully mobile-optimized beyond the app shell.

---

## 7. Deployment Notes

- **Render** auto-deploys from `main` on every push. Root directory: `server`. Build: `npm install`. Start: `npm start`.
- **Vercel** auto-deploys from `main` on every push. Root directory: `client`. Build: `npm run build`. Output: `dist`. A `client/vercel.json` rewrite rule (`"/(.*)" → "/index.html"`) is required for React Router's client-side routes to survive a page refresh — without it, refreshing on any route other than `/` returns a 404.
- Render's free tier spins down after inactivity; the first request after idle can take 50+ seconds.
- **Do not commit `node_modules` or `.env` files.** The project's git history was fully reset once already after both were accidentally committed early on — `.gitignore` now excludes both, and the Atlas password was rotated as a precaution.

---

## 8. Known Limitations / Backlog

- No email-based password reset — only an Administrator can force-reset a user's password via User Management.
- No self-service "change my own password" for logged-in users.
- Stock deduction on batch creation is not transactional (see §4.3) — a failure partway through can leave ingredient stock deducted without a corresponding saved batch.
- `Settings.currency` field exists but isn't actually used anywhere in the UI — all monetary values are hardcoded to display "KSh".
- Individual data-heavy pages (Reports tables especially) aren't fully mobile-optimized yet, just the app shell (sidebar/navbar).
- No automated tests exist for either frontend or backend.
