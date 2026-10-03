# 📦 InventoryPro - Enterprise Inventory Management System

A full-stack Inventory Management System built with React (Vite) + Tailwind CSS, ASP.NET Core 8 Web API and MongoDB. Admins can log in securely, manage products, update stock levels and monitor low-stock items from a clean, responsive dashboard.
---

🛠️ Tech Stack & Tools

* **Frontend:** React.js, HTML5, CSS3, JavaScript, Tailwind CSS 
* **Backend:** ASP.NET Core 8 Web API
* **Database:** MongoDB Atlas
* **Tools & Version Control:** Git, GitHub, Visual Studio

  
## 🏛️ System Architecture

```text
React (Vite + Tailwind CSS)
        │
        ▼ HTTP / REST (JWT Bearer Auth)
ASP.NET Core Web API (Controllers, DI, Middleware)
        │
        ▼ MongoDB.Driver
MongoDB Database (Users, Products Collections)
```

### Tech Stack
- **Frontend**: React 18 (Vite), React Router v6, Axios (with Bearer & 401 interceptors), Tailwind CSS, Lucide Icons, Inter typography.
- **Backend**: C# / ASP.NET Core Web API (.NET 8 / .NET 10 compatible), controller-based with dependency injection.
- **Database**: MongoDB (official `MongoDB.Driver`).
- **Security**: JWT Bearer token authentication, passwords securely hashed using `BCrypt.Net-Next`.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- [.NET SDK 8.0+](https://dotnet.microsoft.com/download)
- [Node.js (v18+)](https://nodejs.org/) & npm
- [MongoDB](https://www.mongodb.com/try/download/community) installed locally or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cloud cluster.

---

### 2. Database Setup

#### Option A: Local MongoDB
Ensure your local MongoDB daemon is running (default port `27017`):
```bash
# Verify or start MongoDB service (Windows)
net start MongoDB
# Or run mongod directly
mongod --dbpath "C:\data\db"
```
The connection string in `Backend/appsettings.json` is configured by default to:
```json
"MongoDbSettings": {
  "ConnectionString": "mongodb://localhost:27017",
  "DatabaseName": "InventoryDB",
  "ProductsCollectionName": "Products",
  "UsersCollectionName": "Users"
}
```

#### Option B: MongoDB Atlas (Cloud)
1. Create a free cluster on [MongoDB Atlas](https://cloud.mongodb.com/).
2. **Network Access (IP Whitelist)**:
   - Navigate to **Network Access** in the left sidebar.
   - Click **Add IP Address**.
   - Either select **Add Current IP Address** or add `0.0.0.0/0` (allow from anywhere) for development access. *If your IP is not whitelisted, the connection will time out.*
3. **Database Access (User Credentials & URL-Encoding)**:
   - Navigate to **Database Access** and verify your MongoDB user credentials.
   - **IMPORTANT**: If your password contains special characters like `@`, `:`, `/`, `?`, `#`, `[`, `]`, or `%`, you **must URL-encode** them in the connection string:
     - `@` &rarr; `%40`
     - `:` &rarr; `%3A`
     - `/` &rarr; `%2F`
     - `?` &rarr; `%3F`
     - `#` &rarr; `%23`
     - `$` &rarr; `%24`
     - `!` &rarr; `%21`
   - *Example:* If password is `P@ssword123!`, encode as `P%40ssword123%21`.
4. Obtain your connection URI from **Database > Connect > Drivers** (e.g. `mongodb+srv://adminUser:P%40ssword123%21@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`).
5. Update `ConnectionString` in `Backend/appsettings.json`:
   ```json
   "MongoDbSettings": {
     "ConnectionString": "mongodb+srv://<username>:<encoded_password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority",
     "DatabaseName": "InventoryDB",
     "ProductsCollectionName": "Products",
     "UsersCollectionName": "Users"
   }
   ```

---

### 3. Backend API Setup & Launch

1. Navigate to the `Backend` directory:
   ```bash
   cd Backend
   ```
2. Restore NuGet dependencies and run:
   ```bash
   dotnet restore
   dotnet run
   ```
3. The API will start on:
   - **HTTP**: `http://localhost:5000`
   - **Interactive Swagger UI**: `http://localhost:5000/swagger`
   - **Health Check**: `http://localhost:5000/api/health`

> **Note on Initial Run:**
> Upon startup, the backend automatically seeds:
> - A default administrator account: `admin` / `Admin@123`
> - 10 realistic sample products across 3 distinct categories (Electronics, Furniture, Office Supplies) including low-stock items.

---

### 4. Frontend Setup & Launch

1. Navigate to the `Frontend` directory:
   ```bash
   cd Frontend
   ```
2. Verify or create `.env` (pre-configured with your backend port):
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
3. Install npm dependencies:
   ```bash
   npm install
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
5. Open your browser at:
   - **Web Application**: `http://localhost:5173`

---

## 🔐 Default Authentication Credentials

| Role | Username | Password | Notes |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `Admin@123` | Click the **"Auto-fill"** button on the Login page for one-click access. |

---

## 📡 REST API Documentation

All product endpoints require a valid JWT Bearer header: `Authorization: Bearer <your_token>`.

### Authentication Endpoints (`/api/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate user; returns JWT token, role, and expiration |
| `POST` | `/api/auth/register` | Register new user account |
| `GET` | `/api/auth/me` | Fetch authenticated user identity and claims (`[Authorize]`) |

### Products Endpoints (`/api/products`)
| Method | Endpoint | Description | Query Parameters |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/products` | Retrieve product list | `search` (name substring), `category` |
| `GET` | `/api/products/{id}` | Retrieve single product by MongoDB ID | - |
| `POST` | `/api/products` | Create a new product | - |
| `PUT` | `/api/products/{id}` | Update existing product details | - |
| `DELETE` | `/api/products/{id}` | Delete product by ID | - |
| `PATCH` | `/api/products/{id}/stock` | Update stock level (`add`, `remove`, `set`) | - |
| `GET` | `/api/products/low-stock` | Retrieve products where `Quantity <= LowStockThreshold` | - |
| `GET` | `/api/products/categories` | Retrieve all distinct categories | - |
| `GET` | `/api/products/stats` | Aggregated dashboard metrics & valuation | - |

#### Stock Update Payload Example:
```json
// PATCH /api/products/{id}/stock
{
  "action": "add",   // "add", "remove", or "set"
  "amount": 15
}
```
*Validation Rule: The system prevents stock from ever dropping below 0.*

---

## 💻 Frontend Features & UI Highlights

1. **Executive Dashboard**:
   - Real-time stat cards: **Total Products**, **Total Stock Value** ($), **Low-Stock Count**, **Categories**.
   - **Low-Stock Watchlist**: Visual safety progress bars indicating stock vs threshold, with immediate restock shortcuts.
   - **Category Distribution**: Breakdown cards with one-click filtering.

2. **Products Catalog Page**:
   - Instant search with debouncing.
   - Dynamic category filter dropdown.
   - Status indicators: `In Stock` (Green), `Low Stock` (Amber), `Out of Stock` (Red).
   - Inline actions: Quick Stock Adjustment, Edit Details, and Delete.

3. **Stock Adjustment Modal**:
   - Quick operations: **Add Stock**, **Remove Stock**, or **Set Exact Quantity**.
   - Real-time calculation preview and prevention of negative balances.

4. **Add / Edit Product Modal**:
   - Full client-side and server-side validation.
   - Unit price validation (> $0), non-negative quantities, customizable categories.

5. **Dedicated Low Stock Page**:
   - High-visibility amber and red rows.
   - Calculated stock shortfall (e.g. `+8 needed`).
   - One-click restock button.

6. **Production Polish**:
   - **Auth Interceptors**: Automatic Bearer token attachment and automatic logout on HTTP 401.
   - **Toast Notifications**: Feedback for all mutations (success, error, warning).
   - **Confirmation Modals**: Prevents accidental record deletions.
   - **Responsive Navigation**: Desktop sidebar + mobile drawer with backdrop blur.
   - **Loading Skeletons & Empty States**: Polished loading and fallback displays.

---

## 🛠️ Project Structure

```text
Inventory Management System/
├── Backend/
│   ├── Controllers/
│   │   ├── AuthController.cs          # Login, Register, Me endpoints
│   │   └── ProductsController.cs      # Full CRUD, stock patch, low-stock, stats
│   ├── DTOs/
│   │   ├── AuthDtos.cs                # LoginDto, AuthResponseDto, RegisterDto
│   │   └── ProductDtos.cs             # Create, Update, StockUpdate, Response DTOs
│   ├── Middleware/
│   │   └── ExceptionMiddleware.cs     # Global JSON error formatting & Mongo error handling
│   ├── Models/
│   │   ├── Product.cs                 # Product BSON entity
│   │   └── User.cs                    # User BSON entity
│   ├── Properties/
│   │   └── launchSettings.json        # Port 5000 (HTTP) & 5001 (HTTPS)
│   ├── Services/
│   │   ├── AuthService.cs             # BCrypt verification, registration, admin seed
│   │   ├── IAuthService.cs
│   │   ├── ProductService.cs          # Stock management, queries, sample seed
│   │   ├── IProductService.cs
│   │   ├── TokenService.cs            # JWT token generation with claims
│   │   └── ITokenService.cs
│   ├── Settings/
│   │   ├── JwtSettings.cs             # Secret key, issuer, expiration
│   │   └── MongoDbSettings.cs         # Connection string, database, collections
│   ├── appsettings.json               # Main application configuration
│   ├── InventoryApi.csproj            # .NET 8 / 10 multi-framework project
│   └── Program.cs                     # DI, JWT Bearer, Swagger, CORS, pipeline
│
├── Frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── axiosInstance.js       # Base Axios instance with Bearer & 401 interceptor
│   │   │   ├── authApi.js             # Auth endpoints
│   │   │   └── productsApi.js         # Products endpoints
│   │   ├── components/
│   │   │   ├── ConfirmModal.jsx       # Reusable delete confirmation modal
│   │   │   ├── EmptyState.jsx         # Clean empty state views
│   │   │   ├── Layout.jsx             # Shell with Sidebar + Navbar + Outlet
│   │   │   ├── LoadingSkeleton.jsx    # Table & card skeletons
│   │   │   ├── Navbar.jsx             # Top bar with user profile & logout
│   │   │   ├── ProductModal.jsx       # Add/Edit product form modal with validation
│   │   │   ├── Sidebar.jsx            # Responsive navigation drawer
│   │   │   └── StockModal.jsx         # Add/Remove/Set quantity adjustment modal
│   │   ├── context/
│   │   │   ├── AuthContext.jsx        # JWT state, login, logout, user info
│   │   │   └── ToastContext.jsx       # Alert notification provider
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx      # Metrics cards, low-stock watchlist, categories
│   │   │   ├── LoginPage.jsx          # Centered card, validation, demo auto-fill
│   │   │   ├── LowStockPage.jsx       # Highlighted alert rows with restock actions
│   │   │   ├── NotFoundPage.jsx       # 404 page
│   │   │   └── ProductsPage.jsx       # Table, search, filter, CRUD modals
│   │   ├── routes/
│   │   │   ├── AppRoutes.jsx          # Route declarations
│   │   │   └── ProtectedRoute.jsx     # Auth guard redirecting to /login
│   │   ├── utils/
│   │   │   └── formatters.js          # Currency, dates, and stock status badges
│   │   ├── App.jsx                    # Root component with providers
│   │   ├── index.css                  # Tailwind directives and custom scrollbar
│   │   └── main.jsx                   # React DOM entry point
│   ├── index.html                     # HTML template with Inter font
│   ├── package.json                   # Dependencies: React 18, Vite, Lucide, Tailwind
│   ├── tailwind.config.js             # Palette and design system
│   └── vite.config.js                 # Vite dev server configuration (port 5173)
│
└── README.md                          # Comprehensive documentation
```
