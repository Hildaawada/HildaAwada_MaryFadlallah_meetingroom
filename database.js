const mongoose = require('mongoose');
require('dotenv').config();

exports.connectDB= async() => {
    try{
        await mongoose.connect(process.env.database_url);
        console.log("Database connected successfully");
    }
    catch(err){
        console.error(err);
        process.exit(1);
    }
}