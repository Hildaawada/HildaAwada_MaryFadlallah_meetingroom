const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ service: "room-service", status: "running" });
});

module.exports = router;
