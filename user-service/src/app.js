const express = require('express');
const app = express();
const DB = require('./database').connectDB;
app.use(express.json());

const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);


require('dotenv').config();  




DB();

app.listen(process.env.PORT, () => {
    console.log(`User Service is running on port ${process.env.PORT}`);
});
