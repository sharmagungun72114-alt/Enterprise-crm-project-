# Enterprise MERN CRM Suite

A complete, production-grade enterprise Customer Relationship Management (CRM) application. It is engineered with a unified, high-performance architecture featuring a Node.js/Express REST API on the backend and an interactive React (Vite) frontend with Tailwind CSS and Recharts.

## 🚀 Key Features

### 🔐 1. Cryptographic Authentication
- **Secure Sessions**: Integrated JSON Web Token (JWT) workflow with local storage persistence.
- **Corporate Profiles**: Registration screens supporting corporate role assignments (*Admin*, *Sales Representative*, *Account Manager*, *Operations Manager*).
- **Password Protection**: Multi-round password salting and verification powered by `bcryptjs`.
- **Session Protection**: Route-guarding redirects unauthorized views back to the landing page.

### 📊 2. Operations & Pipeline Dashboard
- **Live Counters**: Real-time totals for Active Clients, Pipeline Opportunities, Gross Closed Revenue, and Operational Backlogs.
- **Trend Charts**: Interactive sales revenue area charts and deal status funnel distributions powered by `Recharts`.
- **Activity Feed**: Feed detailing recent client registrations.
- **Quick Action Command Modals**: Immediate action overlays to log customers, deal leads, sales, or tasks with one click.

### 👥 3. Advanced Customer Management
- **Enterprise Ledger**: Interactive data table mapping contact details, headquarters, and creation timestamps.
- **Client Filters**: Search across name, company, email, or phone paired with instant status toggles (*Active* vs. *Inactive*).
- **Client Actions**: Form modals to add, update, or permanently delete customer logs.

### 📈 4. Deal Leads & Conversion Funnel
- **Sales Funnel Stages**: Deal status stages: *New*, *Contacted*, *Qualified*, *Proposal*, *Negotiation*, *Won*, *Lost*.
- **Automated Client Promotion**: When a deal is marked as **Won**, the backend automatically promotes the lead contact into the Customer database and logs a matching Sale record.

### 💼 5. Financial Ledger Sales Tracking
- **Revenue Closing**: Trace license distributions, closed contracts, and values.
- **Close Stats**: Metrics on total generated gross sales, average deal size, and peak contract values.

### 📝 6. Daily Task Backlog
- **Operational Deadlines**: Schedule client follow-ups with priority weights (*High*, *Medium*, *Low*) and calendared due dates.
- **Inline Operations**: Double-state checkbox toggles to mark task completions instantly.

---

## 🛠️ Unified Full-Stack Design

To guarantee 100% stability, fast loading, and a zero-configuration experience in sandboxed developer containers, the application features an integrated **JSON File Database Engine** in `/server/db.ts` that persists data directly to `data/db.json`. 

- **Ready Out Of The Box**: Loaded with production-style seed data (6 clients, 7 deal opportunities, 7 sales transactions, and 6 operational tasks).
- **Extensible**: The CRUD controllers and Express REST routes are aligned with standard Mongoose database definitions, making it straightforward to link to a cloud MongoDB service by swapping the JSON controller with a Mongoose connect instance.

---

## 💻 Installation & Running Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm or yarn

### 1. Environment Configurations
Clone this repository and create a `.env` file in the root directory:
```bash
# Required for cryptographic JWT tokens
JWT_SECRET="your_secure_random_jwt_secret_phrase"

# Node mode (production or development)
NODE_ENV="development"
```

### 2. Install Workspace Dependencies
Execute the unified installation step in the root directory:
```bash
npm install
```

### 3. Launch Development Server
Boot both the Express API and the Vite React client concurrently:
```bash
npm run dev
```
The application will boot on **http://localhost:3000** (Vite asset compilation is served dynamically via Express middleware).

### 4. Compiling the Production Bundle
To compile a minimized, fast-loading, standalone bundle for production hosting:
```bash
npm run build
```
The compiled server is bundled into `dist/server.cjs` and the static React assets into `dist/`. Start it with:
```bash
npm run start
```

---

## 🔐 Credentials for Demo Access
To explore the dashboards immediately without registering a new account, use these pre-salted credentials:
* **Demo Email**: `admin@enterprise.com`
* **Demo Password**: `password123`
* **Role**: Admin

---

## 🗃️ Rest API Routes Specification

### Authentication
- `POST /api/auth/register` - Create corporate profile.
- `POST /api/auth/login` - Verify password and return JWT.
- `GET /api/auth/me` - Fetch authenticated credentials.

### Customers
- `GET /api/customers?search=q&status=Active&page=1&limit=10` - Paginated contact table.
- `POST /api/customers` - Register client.
- `PUT /api/customers/:id` - Update details.
- `DELETE /api/customers/:id` - Delete client.

### Leads
- `GET /api/leads?search=q&status=New` - Retrieve opportunities.
- `POST /api/leads` - Add deal.
- `PUT /api/leads/:id` - Adjust status (marking *Won* triggers automated client conversion).
- `DELETE /api/leads/:id` - Remove opportunity.

### Sales Ledger
- `GET /api/sales?search=q` - Transaction lists.
- `POST /api/sales` - Log finished contract.
- `PUT /api/sales/:id` - Update entry.
- `DELETE /api/sales/:id` - Delete entry.

### Tasks Backlog
- `GET /api/tasks` - List operations tasks.
- `POST /api/tasks` - Schedule action item.
- `PUT /api/tasks/:id` - Complete or edit actions.
- `DELETE /api/tasks/:id` - Remove task.

### Analytical Reports
- `GET /api/reports` - Fetch dynamically computed sales curves, lead conversions, product metrics, and database sums.
