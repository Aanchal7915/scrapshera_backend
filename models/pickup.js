const mongoose = require('mongoose');

const pickupSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    address: {
        type: String,
        required: true
    },
    scheduledDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['scheduled', 'completed', 'canceled'],
        default: 'scheduled'
    },
    itemsList: {
        type: String,
        required: true
    },
    location: {
        type: String // Store Google Maps URL
    },
}, { timestamps: true });
module.exports = mongoose.model('Pickup', pickupSchema);