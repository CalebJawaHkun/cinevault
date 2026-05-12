# Express Backend API

Simple Express.js backend setup with MongoDB, Clerk authentication, Cloudinary media storage, and Inngest background jobs.

---

## Tech Stack

- Node.js
- Express.js
- MongoDB + Mongoose
- Clerk Auth
- Cloudinary
- Axios
- Inngest

---

## Dependencies

```json
"dependencies": {
  "@clerk/express": "^2.1.15",
  "axios": "^1.16.0",
  "cloudinary": "^2.10.0",
  "cors": "^2.8.6",
  "dotenv": "^17.4.2",
  "express": "^5.2.1",
  "inngest": "^4.4.0",
  "mongoose": "^9.6.2"
}
```

---

## Installation

```bash
npm install
```

---

## Run Server

```bash
npm run server
```

---

## Written By

### Caleb Jawa Hkun

## Version 1.1.0

 1. Inngest Webhook setup completed with Clerk.
 2. Moongoose initial DB connection setup completed on MongoDB atlas.
 3. Inngest auth eent capture and data relay with Moongoose completed.
 4. A user model is created via Moongose for user data saving.

## Bug Fixes
- inngest index function creationFunciton struction error fixed.