🌿 Plantos Backend
The backend server for Plantos, a plant care and garden management application. This Express.js-based server handles user registration, OTP verification, plant prediction using image uploads, care scheduling, notifications, and media storage.

🚀 Features
User registration and login with OTP verification

JWT-based authentication

Profile picture and plant image uploads (using Cloudinary)

ML integration to predict plant species and diseases

Daily care schedule for each plant (watering, pruning, spraying, etc.)

Twilio integration for SMS reminders

CRUD APIs for garden and plant management

Media gallery for each plant

Modular routing for clean code structure

🛠 Tech Stack
Node.js with Express.js

MongoDB with Mongoose

Cloudinary (image upload)

Twilio (SMS)

CORS & Multer

JWT for authentication

Dotenv for configuration

Python ML integration for plant prediction

Scheduler for daily cron jobs (6 AM plant checks)

📁 Folder Structure
pgsql
Copy
Edit
plantos-backend/
├── Routes/
│   ├── UserRoute.js
│   └── PlantRoute.js
├── Controllers/
│   ├── userController.js
│   └── plantController.js
├── Models/
│   ├── User.js
│   ├── Plant.js
│   └── Task.js
├── Schedule.js
├── connectDB.js
├── server.js
├── .env
└── package.json
🔐 Environment Variables
Create a .env file in the root directory:

ini
Copy
Edit
PORT=3000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth
TWILIO_PHONE_NUMBER=your_twilio_number
🧪 API Endpoints
User
POST /api/user/register

POST /api/user/send-otp

POST /api/user/verify-otp

POST /api/user/login

POST /api/user/get_today_schedule

Plant
POST /api/plant/predict-plant

POST /api/plant/predict-status

POST /api/plant/get-garden

POST /api/plant/get-plant

POST /api/plant/toggle

⚙️ Setup Instructions
bash
Copy
Edit
git clone https://github.com/your-username/plantos-backend.git
cd plantos-backend
npm install
npm run start
📆 Daily Schedule
A cron-like function runs at 6:00 AM daily (via Schedule.js) to:

Check all plants' nextWater date

Trigger Twilio SMS reminders if watering is due

📸 ML Integration
Plant prediction uses images uploaded by the user

The server forwards image data to a Python script for species & disease classification

🧩 Dependencies
bash
Copy
Edit
npm install express mongoose multer cloudinary dotenv cors jsonwebtoken twilio axios
🙋‍♂️ Author
Yash Sinha