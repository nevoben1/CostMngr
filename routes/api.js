/*
   API Routes (Main)

   Central router combining all API endpoints for costs, users, and admin operations.
   This file consolidates multiple route handlers into a single router.
  */

const express = require('express');
const router = express.Router();

// Import individual route modules
const costRoutes = require('./CostRoutes');
const userRoutes = require('./UserRoutes');
const adminRoutes = require('./AdminRoutes');

// Mount route modules
router.use('/', costRoutes);
router.use('/', userRoutes);
router.use('/', adminRoutes);

module.exports = router;
