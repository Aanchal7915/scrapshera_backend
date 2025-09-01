const express = require('express');
const router = express.Router();
const pickupController = require('../controllers/pickup');
const { authenticate, isAdmin, isUser } = require('../middleware/auth');

// Create a new pickup (user only)
router.post('/', authenticate, isUser, pickupController.createPickup);

// Get all pickups (admin only)
router.get('/', authenticate, pickupController.getAllPickups);

// Get pickups for logged-in user
router.get('/my', authenticate, pickupController.getUserPickups);

// Get a single pickup by ID (user or admin)
router.get('/:id', authenticate, pickupController.getPickupById);

// Update a pickup (user or admin)
router.put('/:id', authenticate, pickupController.updatePickup);

// Delete a pickup (user or admin)
router.delete('/:id', authenticate, pickupController.deletePickup);

module.exports = router;
