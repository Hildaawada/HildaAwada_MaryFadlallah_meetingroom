
const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const { connectDB } = require("../src/database");

require("dotenv").config();

const serviceKey = process.env.SERVICE_KEY;

const adminToken =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5Mjg0MDc3ZTU5Y2MzNzAzZjM5NjdhMiIsInVzZXJuYW1lIjoiYWRtaW54eCIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2NDI0NTcyNCwiZXhwIjoxNzY0MzMyMTI0fQ.7Mb4nGvN5-ma0Xw-lotqFAFPLzA2Lyy7QtGJ9r9JA1s";

const managerToken =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5Mjg0MGExZTU5Y2MzNzAzZjM5NjdhNiIsInVzZXJuYW1lIjoibWFuYWdlcnh4Iiwicm9sZSI6Im1hbmFnZXIiLCJpYXQiOjE3NjQyNDU2NzYsImV4cCI6MTc2NDMzMjA3Nn0.xpkNVqWwGNL5TC66ALzk3lPYg8NBkZnk23mIE5agCmk";

const userToken =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5Mjg0MDhkZTU5Y2MzNzAzZjM5NjdhNCIsInVzZXJuYW1lIjoidXNlcnh4Iiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NjQyNDU3NTIsImV4cCI6MTc2NDMzMjE1Mn0.9X21rni83-4dfF9iSZXmOjD-3vlWLM2gb22WHE_kNy8";

jest.setTimeout(30000);

let server;

beforeAll(async () => {
  await connectDB();
  server = app.listen(6001);    // unique test port
});

afterAll(async () => {
  await mongoose.connection.close();
  server.close();
});

//tests
describe("Room Service Tests", () => {

  // add room
  describe("POST /rooms", () => {
    it("should allow admin/manager to add a room", async () => {
      const newRoom = {
        roomID: "RTEST_A1",
        name: "Test Admin Room",
        capacity: 12,
        equipment: ["Projector", "Whiteboard"],
        location: "Bechtel"
      };

      const response = await request(server)
        .post("/v1/rooms")
        .set("Authorization", `Bearer ${managerToken}`)
        .send(newRoom);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.room.roomID).toBe("RTEST_A1");
    });

    it("should reject normal users from adding rooms", async () => {
      const response = await request(server)
        .post("/v1/rooms")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          roomID: "RTEST_FAIL",
          name: "Blocked Room"
        });

      expect(response.status).toBe(403);
    });
  });

  // update room
  describe("PUT /rooms/:id", () => {
    let roomId;

    beforeAll(async () => {
      const create = await request(server)
        .post("/v1/rooms")
        .set("Authorization", `Bearer ${managerToken}`)
        .send({
          roomID: "RUPDATE_1",
          name: "Update Test",
          capacity: 10,
          equipment: ["TV"],
          location: "AUB"
        });

      roomId = create.body.room._id;
    });

    it("should update the room", async () => {
      const response = await request(server)
        .put(`/v1/rooms/${roomId}`)
        .set("Authorization", `Bearer ${managerToken}`)
        .send({
          capacity: 30,
          equipment: ["Projector", "HDMI"]
        });

      expect(response.status).toBe(200);
      expect(response.body.capacity).toBe(30);
    });
  });

  // delete room
  describe("DELETE /rooms/:id", () => {
    let roomId;

    beforeAll(async () => {
      const create = await request(server)
        .post("/v1/rooms")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          roomID: "RDEL_1",
          name: "ToDelete",
          capacity: 5,
          equipment: [],
          location: "AUB"
        });

      roomId = create.body.room._id;
    });

    it("should delete room by admin", async () => {
      const response = await request(server)
        .delete(`/v1/rooms/${roomId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Room deleted successfully");
    });

    it("should block non-admin from deleting", async () => {
      const response = await request(server)
        .delete(`/v1/rooms/${roomId}`)
        .set("Authorization", `Bearer ${managerToken}`);

      expect(response.status).toBe(403);
    });
  });

  //search rooms
  describe("GET /rooms/search", () => {
    it("should return filtered room list", async () => {
      const response = await request(server)
        .get("/v1/rooms/search?capacity=10&location=AUB&equipment=TV")
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  //change status
  describe("PATCH /rooms/:id/status", () => {
    let roomId;

    beforeAll(async () => {
      const create = await request(server)
        .post("/v1/rooms")
        .set("Authorization", `Bearer ${managerToken}`)
        .send({
          roomID: "RSTATUS_1",
          name: "StatusTest",
          capacity: 20,
          equipment: ["Whiteboard"],
          location: "AUB"
        });

      roomId = create.body.room._id;
    });

    it("should change room status", async () => {
      const response = await request(server)
        .patch(`/v1/rooms/${roomId}/status`)
        .set("Authorization", `Bearer ${managerToken}`)
        .send({ status: "out-of-service" });

      expect(response.status).toBe(200);
      expect(response.body.room.status).toBe("out-of-service");
    });
  });

 //internal room operations
  describe("Internal room operations", () => {
    const internalRoomID = "RINT_1";

    beforeAll(async () => {
      await request(server)
        .post("/v1/rooms")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          roomID: internalRoomID,
          name: "InternalRoom",
          capacity: 10,
          equipment: ["TV"],
          location: "AUB"
        });
    });

    it("should check if room exists", async () => {
      const response = await request(server)
        .get(`/v1/rooms/internal/${internalRoomID}`)
        .set("x-service-key", serviceKey);

      expect(response.status).toBe(200);
      expect(response.body.exists).toBe(true);
    });

    it("should change status internally", async () => {
      const response = await request(server)
        .patch(`/v1/rooms/internal/${internalRoomID}/status`)
        .set("x-service-key", serviceKey)
        .send({ status: "booked" });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("booked");
    });
  });

});
