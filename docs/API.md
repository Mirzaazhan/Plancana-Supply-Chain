# Agricultural Supply Chain API Documentation

## Authentication Endpoints

### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "farmer@example.com",
  "username": "farmer_john",
  "password": "secure_password",
  "role": "FARMER",
  "profileData": {
    "firstName": "John",
    "lastName": "Doe",
    "farmName": "Doe Family Farm",
    "phone": "+60123456789",
    "farmSize": 25.5,
    "primaryCrops": ["RICE", "CORN"]
  }
}

POST /api/auth/login
Content-Type: application/json

{
  "email": "farmer@example.com",
  "password": "secure_password"
}
GET /api/auth/profile
Authorization: Bearer <jwt_token>

POST /api/batch/create
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "farmer": "John Doe",
  "crop": "Rice",
  "quantity": 1000,
  "location": "Selangor, Malaysia",
  "variety": "Basmati",
  "harvestDate": "2024-01-15",
  "cultivationMethod": "Organic",
  "qualityGrade": "Grade A"
}
