# 💊 Pillway Transfer App

A full-stack web application that allows users to search for pharmacies using Google Maps and submit transfer requests through a simple step-by-step flow.

---

## 🚀 Features

* User signup and login
* Search pharmacies using Google Maps (Places API)
* Interactive map with location selection
* Multi-step transfer request flow
* Review and submit pharmacy transfer
* Data stored in MySQL database

---

## 🧠 Tech Stack

* **Frontend:** Angular
* **Backend:** Node.js / Express
* **Database:** MySQL
* **Maps:** Google Maps JavaScript API

---

## ⚙️ Setup

### 1. Clone the repo

```bash
git clone https://github.com/your-username/pillway.git
cd pillway
```

---

### 2. Backend setup

```bash
cd backend
npm install
npm start
```

---

### 3. Frontend setup

```bash
cd frontend
npm install
ng serve
```

---

### 4. Database setup

Run the SQL script:

```sql
CREATE DATABASE pillway;
-- then run your schema.sql
```

---

## 🔑 Configuration

### Google Maps API Key

Add your API key in `frontend/index.html`:

```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places"></script>
```

---

### Database Config

Update credentials in:

```
backend/src/config/db.js
```

```js
password: 'YOUR_DB_PASSWORD'
```

---

## 📄 License

MIT

