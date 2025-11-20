const express = require('express');
const app = express();
const DB = require('./database').connectDB;
app.use(express.json());

const reviewRoutes = require('./routes/reviewRoutes');
app.use('/api/Review', reviewRoutes);


require('dotenv').config();  



DB();

app.listen(process.env.PORT, () => {
    console.log(`Review Service is running on port ${process.env.PORT}`);


});
