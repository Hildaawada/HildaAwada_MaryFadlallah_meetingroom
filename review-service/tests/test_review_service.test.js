const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");          // express app only
const { connectDB } = require("../src/database");
require("dotenv").config();

jest.mock("axios");
const axios = require("axios");

// Make room-service always succeed
axios.get.mockResolvedValue({
  data: { exists: true }
});

// REAL TOKENS
const adminToken =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5Mjg0MDc3ZTU5Y2MzNzAzZjM5NjdhMiIsInVzZXJuYW1lIjoiYWRtaW54eCIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2NDI0NTcyNCwiZXhwIjoxNzY0MzMyMTI0fQ.7Mb4nGvN5-ma0Xw-lotqFAFPLzA2Lyy7QtGJ9r9JA1s";

const moderatorToken = adminToken; // mock moderator same permissions

const userToken =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5Mjg0MDhkZTU5Y2MzNzAzZjM5NjdhNCIsInVzZXJuYW1lIjoidXNlcnh4Iiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NjQyNDU3NTIsImV4cCI6MTc2NDMzMjE1Mn0.9X21rni83-4dfF9iSZXmOjD-3vlWLM2gb22WHE_kNy8";

jest.setTimeout(30000);

let server;

// ------------------------------------------------------------
// CONNECT DB + START SERVER FOR TESTING
// ------------------------------------------------------------
beforeAll(async () => {
  await connectDB();
  server = app.listen(6002); // safe port for jest
});

// ------------------------------------------------------------
// CLEANUP
// ------------------------------------------------------------
afterAll(async () => {
  await mongoose.connection.close();
  server.close();
});

// ------------------------------------------------------------
// TESTS
// ------------------------------------------------------------
describe("Review Service Tests", () => {

  let reviewId;

  // ------------------------------------------------------------
  // 1. SUBMIT REVIEW
  // ------------------------------------------------------------
  describe("POST /Review/review", () => {
    it("should submit a new review", async () => {
      const response = await request(server)
        .post("/v1/Review/review")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          roomID: "ROOM_TEST_1",
          rating: 5,
          comment: "Amazing room!"
        });

      expect(response.status).toBe(201);
      expect(response.body.rating).toBe(5);

      reviewId = response.body._id;
    });
  });

  // ------------------------------------------------------------
  // 2. GET MY REVIEWS
  // ------------------------------------------------------------
  describe("GET /Review/me", () => {
    it("should get all reviews by logged-in user", async () => {
      const response = await request(server)
        .get("/v1/Review/me")
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  // ------------------------------------------------------------
  // 3. UPDATE MY REVIEW
  // ------------------------------------------------------------
  describe("PUT /Review/:id", () => {
    it("should update user review", async () => {
      const response = await request(server)
        .put(`/v1/Review/${reviewId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          rating: 4,
          comment: "Updated comment"
        });

      expect(response.status).toBe(200);
      expect(response.body.rating).toBe(4);
    });
  });

  // ------------------------------------------------------------
  // 4. GET ROOM REVIEWS
  // ------------------------------------------------------------
  describe("GET /Review/room/:roomID", () => {
    it("should get room reviews", async () => {
      const response = await request(server)
        .get("/v1/Review/room/ROOM_TEST_1")
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  // ------------------------------------------------------------
  // 5. FLAG REVIEW
  // ------------------------------------------------------------
  describe("POST /Review/:id/flag", () => {
    it("should flag a review", async () => {
      const response = await request(server)
        .post(`/v1/Review/${reviewId}/flag`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ why: "Inappropriate language" });

      expect(response.status).toBe(200);
      expect(response.body.review.flagged).toBe(true);
    });
  });

  // ------------------------------------------------------------
  // 6. UNFLAG REVIEW
  // ------------------------------------------------------------
  describe("POST /Review/:id/unflag", () => {
    it("should unflag a review", async () => {
      const response = await request(server)
        .post(`/v1/Review/${reviewId}/unflag`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.review.flagged).toBe(false);
    });
  });

  // ------------------------------------------------------------
  // 7. HIDE REVIEW
  // ------------------------------------------------------------
  describe("PATCH /Review/:id/hide", () => {
    it("should hide a review", async () => {
      const response = await request(server)
        .patch(`/v1/Review/${reviewId}/hide`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.review.hidden).toBe(true);
    });
  });

  // ------------------------------------------------------------
  // 8. UNHIDE REVIEW
  // ------------------------------------------------------------
  describe("PATCH /Review/:id/unhide", () => {
    it("should unhide a review", async () => {
      const response = await request(server)
        .patch(`/v1/Review/${reviewId}/unhide`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.review.hidden).toBe(false);
    });
  });

  // ------------------------------------------------------------
  // 9. DELETE MY REVIEW
  // ------------------------------------------------------------
  describe("DELETE /Review/:id", () => {
    it("should delete the user's own review", async () => {
      const response = await request(server)
        .delete(`/v1/Review/${reviewId}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Review deleted successfully");
    });
  });

});
