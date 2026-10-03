# 📦 InventoryPro - Enterprise Inventory Management System

A simple full-stack inventory management app built with React, ASP.NET Core and MongoDB. I built it to practice connecting a React frontend to a C# Web API with JWT login and a MongoDB database.

An admin can log in, add and edit products, update stock, and see which items are running low.

  
## ✨ Features

* Login with JWT authentication
* Add, edit and delete products
* Search products by name and filter by category
* Update stock (add, remove or set a quantity), never below 0
* Low-stock page for products at or below their threshold
* Dashboard with total products, stock value, low-stock count and categories
* Responsive layout with toast messages and delete confirmation

### Tech Stack
- **Frontend**:React.js, Tailwind CSS, HTML5, CSS3, JavaScript, Tailwind CSS
- **Backend**: C# , ASP.NET 
- **Database**: MongoDB 
- **Tools & Version Control:** Git, GitHub, Visual Studio

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
└── README.md


📄 License
This project is open-source and available under the MIT License.


     # Comprehensive documentation
```
