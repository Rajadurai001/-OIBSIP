const express = require('express');
const router = express.Router();
const { getPizzaOptions } = require('../controllers/pizzaController');

router.get('/options', getPizzaOptions);

module.exports = router;
