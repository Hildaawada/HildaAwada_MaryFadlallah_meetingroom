const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const { connectDB } = require("../src/database");
require("dotenv").config();
process.env.JWT_SECRET="mysecret123";

// MOCK AXIOS + CIRCUIT BREAKER

jest.mock("axios", () => ({
  patch: jest.fn().mockResolvedValue({ data: {} }),
  get: jest.fn().mockResolvedValue({ data: { exists: true } }),
}));

jest.mock("../src/utils/circuitBreaker", () => ({
  fire: jest.fn().mockResolvedValue({ data: { exists: true } }),
}));

// MOCK updateRoomStatusBasedOnBookings

jest.mock("../src/controllers/bookingsController", () => {
  const original = jest.requireActual("../src/controllers/bookingsController");

  return {
    ...original,
    updateRoomStatusBasedOnBookings: jest.fn().mockResolvedValue(),
  };
});

const adminToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5Mjg0MDc3ZTU5Y2MzNzAzZjM5NjdhMiIsInVzZXJuYW1lIjoiYWRtaW54eCIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2NDMzMzMyNSwiZXhwIjoxNzY0NDE5NzI1fQ.wU6LVxiWQQi_OffrmWpqdadZ5OoI5pWchTyL24MjtW0";
const userToken ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5Mjg0MDhkZTU5Y2MzNzAzZjM5NjdhNCIsInVzZXJuYW1lIjoidXNlcnh4Iiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NjQzMzMyOTIsImV4cCI6MTc2NDQxOTY5Mn0.a-gxmrkYzBf4M4rOW8SJrACAsZ8UY1NwTFAIwxlND90";
jest.setTimeout(30000);

let server;
let createdBookingId;

beforeAll(async () => {
  await connectDB();
  server = app.listen(6003);
});

afterAll(async () => {
  await mongoose.connection.close();
  server.close();
});

//tests
describe("Bookings Service Tests", () => {

  // create booking
  it("should create a booking", async () => {
    const response = await request(server)
      .post("/v1/Bookings/Book")
      .set("Authorization", "Bearer " + userToken)
      .send({
        roomID: "B2",   // FIXED
        checkin: "2030-01-01T10:00:00.000Z",
        checkout: "2030-01-01T11:00:00.000Z",
      });

    expect(response.status).toBe(201);
    createdBookingId = response.body._id;
  });

  //2. get my bookings
  it("should get user bookings", async () => {
    const response = await request(server)
      .get("/v1/Bookings/me")
      .set("Authorization", "Bearer " + userToken);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  //3.update booking
  it("should update the booking", async () => {
    const response = await request(server)
      .put(`/v1/Bookings/${createdBookingId}`)
      .set("Authorization", "Bearer " + userToken)
      .send({
        checkin: "2030-01-01T11:00:00.000Z",
        checkout: "2030-01-01T12:00:00.000Z",
      });

    expect(response.status).toBe(200);
  });

  //4.check availability
  it("should check room availability", async () => {
    const response = await request(server)
      .get("/v1/Bookings/availability")
      .set("Authorization", "Bearer " + userToken)
      .query({
        roomID: "B2",   // FIXED
        checkin: "2040-01-01T10:00:00.000Z",
        checkout: "2040-01-01T11:00:00.000Z",
      });

    expect(response.status).toBe(200);
  });

  //5. get all bookings (admin)
  it("should return all non-cancelled bookings", async () => {
    const response = await request(server)
      .get("/v1/Bookings/")
      .set("Authorization", "Bearer " + adminToken);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  //6. cancel booking
  it("should cancel user booking", async () => {
    const response = await request(server)
      .delete(`/v1/Bookings/${createdBookingId}`)
      .set("Authorization", "Bearer " + userToken);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Booking cancelled");
  });

});
