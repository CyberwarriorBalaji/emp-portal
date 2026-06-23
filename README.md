# 🏢 EmpPortal — Employee Management System

A full-stack, production-ready Employee Management Portal built with **Python (FastAPI)** + **React.js** + **MongoDB**.

---

## 📁 Project Structure

```
emp-portal/
├── backend/          ← FastAPI (Python) — deploy on Render
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   ├── requirements.txt
│   ├── render.yaml
│   ├── models/
│   │   └── user.py
│   ├── routes/
│   │   ├── auth.py
│   │   └── users.py
│   └── utils/
│       ├── auth.py
│       └── otp.py
│
└── frontend/         ← React + Vite — deploy on Netlify
    ├── index.html
    ├── vite.config.js
    ├── netlify.toml
    ├── package.json
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        ├── context/AuthContext.jsx
        ├── utils/api.js
        ├── components/
        │   ├── LoadingScreen.jsx
        │   └── UserModal.jsx
        └── pages/
            ├── LoginPage.jsx
            ├── RegisterPage.jsx
            ├── AdminDashboard.jsx
            ├── EmployeeDashboard.jsx
            └── GitHubCallback.jsx
```

---

## ✨ Features

| Feature | Details |
|---|---|
| 🔐 Auth | Email+Password, Email OTP, SMS OTP, Google OAuth, GitHub OAuth |
| 👥 Roles | Admin (Head), Employee, Worker |
| ✅ Approvals | Admin approves/rejects new user registrations |
| 📸 File Upload | Profile photo + multiple certificates (PDF/Image) |
| 🔗 Social Links | GitHub, Instagram, LinkedIn |
| 🛡️ Security | JWT tokens, role-based route protection, OTP expiry (5 min) |
| 📱 Responsive | Mobile-friendly, dark corporate UI |

---

## 🚀 QUICK START (Local Development)

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy and fill environment file
cp .env.example .env
# Edit .env with your MongoDB URL, JWT secret, etc.

# Run the server
uvicorn main:app --reload --port 8000
```

Backend runs at: http://localhost:8000
API docs (Swagger): http://localhost:8000/docs

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy and fill environment file
cp .env.example .env
# At minimum set: VITE_GOOGLE_CLIENT_ID (optional for local dev)

# Run dev server
npm run dev
```

Frontend runs at: http://localhost:5173

### 3. First Login

The **very first user to register** is automatically made **Admin** and **approved**.
All subsequent users are `pending` until the admin approves them.

---

## ☁️ DEPLOYMENT

### Step 1 — MongoDB Atlas (Free)

1. Go to https://mongodb.com/atlas and create a free cluster
2. Create a database user with username/password
3. Whitelist IP: `0.0.0.0/0` (allow all — needed for Render)
4. Click **Connect → Drivers** and copy your connection string:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/empportal?retryWrites=true&w=majority
   ```

---

### Step 2 — Deploy Backend on Render

1. Push your `backend/` folder to a GitHub repo (or the full project)
2. Go to https://render.com → **New → Web Service**
3. Connect your GitHub repo
4. Set these fields:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Runtime**: Python 3

5. Add Environment Variables in Render dashboard:

| Key | Value |
|---|---|
| `MONGODB_URL` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | Any long random string (e.g. 64 random chars) |
| `FRONTEND_URL` | Your Netlify URL (add after step 3) |
| `FROM_EMAIL` | Your verified sender email |
| `SENDGRID_API_KEY` | (optional) Your SendGrid key |
| `GOOGLE_CLIENT_ID` | (optional) Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | (optional) Google OAuth secret |
| `GITHUB_CLIENT_ID` | (optional) GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | (optional) GitHub OAuth app secret |
| `TWILIO_ACCOUNT_SID` | (optional) Twilio SID |
| `TWILIO_AUTH_TOKEN` | (optional) Twilio auth token |
| `TWILIO_PHONE_NUMBER` | (optional) Your Twilio phone number |

6. Deploy — note your backend URL e.g. `https://empportal-backend.onrender.com`

---

### Step 3 — Deploy Frontend on Netlify

1. Go to https://netlify.com → **Add new site → Import from Git**
2. Connect your GitHub repo
3. Set build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`

4. Add Environment Variables in Netlify dashboard:

| Key | Value |
|---|---|
| `VITE_API_URL` | Your Render backend URL |
| `VITE_GOOGLE_CLIENT_ID` | (optional) Google OAuth client ID |
| `VITE_GITHUB_CLIENT_ID` | (optional) GitHub OAuth app client ID |

5. Deploy — note your frontend URL e.g. `https://empportal.netlify.app`

6. Go back to Render → update `FRONTEND_URL` env var with your Netlify URL

---

## 🔑 OAuth Setup (Optional but Recommended)

### Google OAuth
1. Go to https://console.cloud.google.com
2. Create a project → **APIs & Services → Credentials**
3. Create **OAuth 2.0 Client ID** (Web application)
4. Add Authorized JavaScript origins:
   - `http://localhost:5173`
   - `https://your-netlify-url.netlify.app`
5. Copy **Client ID** → set as `VITE_GOOGLE_CLIENT_ID` (frontend) and `GOOGLE_CLIENT_ID` (backend)
6. Copy **Client Secret** → set as `GOOGLE_CLIENT_SECRET` (backend only)

### GitHub OAuth
1. Go to https://github.com/settings/developers → **New OAuth App**
2. Set:
   - **Homepage URL**: `https://your-netlify-url.netlify.app`
   - **Callback URL**: `https://your-netlify-url.netlify.app/github-callback`
3. Copy **Client ID** → set as `VITE_GITHUB_CLIENT_ID` (frontend) and `GITHUB_CLIENT_ID` (backend)
4. Generate **Client Secret** → set as `GITHUB_CLIENT_SECRET` (backend only)

### SendGrid (Email OTP)
1. Sign up at https://sendgrid.com (free tier: 100 emails/day)
2. **Settings → API Keys → Create API Key** (Full Access)
3. **Settings → Sender Authentication** → verify your sender email
4. Set `SENDGRID_API_KEY` and `FROM_EMAIL` in backend env vars

> **Dev mode**: If SendGrid is not configured, OTPs are printed to the backend console log.

### Twilio (SMS OTP)
1. Sign up at https://twilio.com (free trial credits)
2. Get **Account SID**, **Auth Token**, and a **Twilio phone number**
3. Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`

> **Dev mode**: If Twilio is not configured, OTPs are printed to the backend console log.

---

## 🔌 API Reference

### Auth Endpoints
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register with email + password |
| POST | `/api/auth/login` | Login with email + password |
| POST | `/api/auth/otp/send` | Send email OTP |
| POST | `/api/auth/otp/verify` | Verify email OTP & login |
| POST | `/api/auth/sms/send` | Send SMS OTP |
| POST | `/api/auth/sms/verify` | Verify SMS OTP & login |
| POST | `/api/auth/google` | Google OAuth login/register |
| POST | `/api/auth/github` | GitHub OAuth login/register |

### User Endpoints (JWT required)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users/me` | Get my profile |
| PUT | `/api/users/me` | Update my profile |
| POST | `/api/users/me/photo` | Upload profile photo |
| POST | `/api/users/me/certificates` | Upload certificate |
| DELETE | `/api/users/me/certificates/{idx}` | Delete certificate |

### Admin Endpoints (JWT + Admin role required)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users/` | List all users |
| GET | `/api/users/{id}` | Get user by ID |
| PUT | `/api/users/{id}/status` | Approve or reject user |
| PUT | `/api/users/{id}/role` | Change user role |
| DELETE | `/api/users/{id}` | Delete user |

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11+, FastAPI, Uvicorn |
| Database | MongoDB (Motor async driver) |
| Auth | JWT (python-jose), bcrypt (passlib) |
| Email | SendGrid |
| SMS | Twilio |
| OAuth | Google, GitHub |
| File Upload | python-multipart, aiofiles |
| Frontend | React 18, Vite, React Router v6 |
| HTTP Client | Axios |
| Notifications | react-hot-toast |
| Icons | lucide-react |
| Deployment | Render (backend), Netlify (frontend), MongoDB Atlas (DB) |

---

## 🔒 Security Notes

- JWT tokens expire in 24 hours (configurable via `ACCESS_TOKEN_EXPIRE_MINUTES`)
- OTPs expire in **5 minutes** and are single-use
- Passwords hashed with **bcrypt**
- Admin routes protected with role middleware
- File uploads restricted to allowed MIME types (images + PDF)
- Max file size: **5 MB** per upload
- CORS restricted to your frontend URL in production

---

## 📝 License

MIT — free to use, modify, and deploy.
# emp-portal
