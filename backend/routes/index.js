const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.send('Video chat backend working');
});

module.exports = router;
