const app = require("./app");
const { connectDB } = require("./database");
require("dotenv").config();

connectDB().then(() => {
  app.listen(process.env.PORT, () => {
    console.log(`Bookings Service running on port ${process.env.PORT}`);
  });
});
