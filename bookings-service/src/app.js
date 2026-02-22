const express = require('express');
const app = express();
const DB = require('./database').connectDB;
app.use(express.json());

const bookingsRoutes = require('./routes/bookingRoutes');
app.use('/api/Bookings', bookingsRoutes);


require('dotenv').config();  



DB();

app.listen(process.env.PORT, () => {
    console.log(`Bookings Service is running on port ${process.env.PORT}`);

app.get("/health", (req, res) => {
  res.json({ service: "bookings", status: "ok" });
});

});
