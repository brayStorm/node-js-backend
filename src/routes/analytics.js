const express = require("express");
const mock = require("../mock");

const router = express.Router();

router.get('/', (req, res) => {
    res.json(mock.analytics);
});

module.exports = router;