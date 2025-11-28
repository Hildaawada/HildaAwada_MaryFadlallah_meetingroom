const request = require('supertest');
const server = require('../src/app');  // Import the server from app.js (with the exported server instance)

// Provided JWT token (for testing purposes)
let token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MjE4ZmUxZDQ4NmQyZDczNzg4ZWFjNSIsInVzZXJuYW1lIjoiaGlsZGEiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NjQxNTU1NzMsImV4cCI6MTc2NDI0MTk3M30.BhHgu8BWd8mH1ekGfEt82BK0epDGbpXTyhusRh2Y_mE";  // Provided token

// Set Jest Timeout to 30 seconds
jest.setTimeout(30000);  // Increase timeout to 30 seconds for this test suite

// Describe the test suite for User Service Tests
describe("User Service Tests", () => {

  // 1. Test User Registration
  describe("POST /users/register", () => {
    it("should create a new user and return 201 status", async () => {
      const newUser = {
        name: "Hilda Awada",
        username: "hildaawada",
        email: "hilda@example.com",
        password: "password123",
        role: "admin", // or "admin" depending on your role
      };

      const response = await request(server)  // Use the imported server instance
        .post("/v1/users/register")
        .send(newUser);

      expect(response.status).toBe(201);  
      expect(response.body.success).toBe(true);  
      expect(response.body.message).toBe("User registered successfully"); 
      expect(response.body.user).toHaveProperty("username", newUser.username);  // Check that the response contains the correct username
    });
  });

  // 2. Test User Login
  describe("POST /users/login", () => {
    it("should log in the user and return a JWT token", async () => {
      const loginData = {
        username: "hildaawada",
        password: "password123",
      };

      const response = await request(server)  // Use the imported server instance
        .post("/v1/users/login")
        .send(loginData);

      expect(response.status).toBe(200);  // Successful login
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();  // Ensure token is returned
      token = response.body.token;  // Save the token for further tests
    });
  });

  // 3. Test Get User by Username
  describe("GET /users/:username", () => {
    it("should fetch user data by username", async () => {
      const username = "hildaawada"; // Ensure this user exists in your database

      const response = await request(server)  // Use the imported server instance
        .get(`/v1/users/${username}`)
        .set('Authorization', `Bearer ${token}`);  // Include the token for authorization

      expect(response.status).toBe(200);  // User should be found
      expect(response.body.success).toBe(true);
      expect(response.body.user.username).toBe(username);
    });
  });

  // 4. Test Update User Profile
  describe("PUT /users/:username", () => {
    it("should update the user's profile", async () => {
      const updatedData = {
        name: "Hilda Awada Updated",
      };

      const response = await request(server)  // Use the imported server instance
        .put("/v1/users/hildaawada")  // Specify the username
        .send(updatedData)
        .set('Authorization', `Bearer ${token}`);  // Include the token for authorization

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.updatedUser.name).toBe(updatedData.name);
    });
  });

  // 5. Test Delete User (Admin only)
  describe("DELETE /users/:username", () => {
    it("should delete the user", async () => {
      const response = await request(server)  
        .delete("/v1/users/hildaawada")
        .set('Authorization', `Bearer ${token}`);  // Admin JWT token required

      expect(response.status).toBe(200);  // User deleted successfully
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("User deleted successfully");
    });
  });

  // 6. Test Get User Booking History
  describe("GET /users/:username/bookings", () => {
    it("should fetch user booking history", async () => {
      const username = "hildaawada"; // Ensure this user exists and has booking history

      const response = await request(server)  
        .get(`/v1/users/${username}/bookings`)
        .set('Authorization', `Bearer ${token}`);  

      expect(response.status).toBe(200);
      expect(response.body.username).toBe(username);
      expect(response.body.bookings).toBeDefined();  
    });
  });
});

// Close the server after tests are done
afterAll(async () => {
  server.close();  
});
