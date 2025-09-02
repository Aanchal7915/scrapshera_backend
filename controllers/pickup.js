
const nodemailer = require('nodemailer');
const Pickup = require('../models/pickup');

// Create a new pickup
exports.createPickup = async (req, res) => {
  try {
    const {
      pickupLocation,
      dateTime,
      itemsList,
      latitude,
      longitude,
    } = req.body;

    // Build Google Maps location string if coordinates are present
    let locationUrl = '';
    if (latitude && longitude) {
      locationUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
    }


    const pickup = new Pickup({
      user: req.user._id,
      address: pickupLocation,
      scheduledDate: dateTime,
      itemsList,
      location: locationUrl, // Store Google Maps URL
    });

    await pickup.save();

    // Send email to scrapshera01@gmail.com with pickup details
    try {
      // Configure transporter (using Gmail)
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'scrapshera01@gmail.com',
          pass: process.env.GMAIL_APP_PASSWORD // Store app password in .env
        }
      });

      // Email content
      const mailOptions = {
        from: 'scrapshera01@gmail.com',
        to: 'scrapshera01@gmail.com',
        subject: 'New Pickup Created',
        html: `<h2>New Pickup Request</h2>
          <p><strong>User ID:</strong> ${pickup.user}</p>
          <p><strong>Address:</strong> ${pickup.address}</p>
          <p><strong>Scheduled Date:</strong> ${pickup.scheduledDate}</p>
          <p><strong>Items List:</strong> ${pickup.itemsList}</p>
          <p><strong>Location:</strong> <a href='${pickup.location}'>Google Maps</a></p>`
      };


      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      // Log email error but don't block pickup creation
      console.error('Failed to send pickup email:', emailError);
    }

    res.status(201).json(pickup);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get all pickups (admin only)
exports.getAllPickups = async (req, res) => {
  try {
    const { page = 1, limit = 10, email, status, startDate, endDate, sort = 'desc' } = req.query;
    let filter = {};
    if (status) filter.status = status;
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0,0,0,0);
      const end = new Date(endDate);
      end.setHours(23,59,59,999);
      filter.scheduledDate = { $gte: start, $lte: end };
    } else if (startDate) {
      const start = new Date(startDate);
      start.setHours(0,0,0,0);
      const end = new Date(startDate);
      end.setHours(23,59,59,999);
      filter.scheduledDate = { $gte: start, $lte: end };
    }
    let query = Pickup.find(filter).populate('user', 'name email phoneNu');
    if (email) {
      // Filter by user email using populate match
      query = query.populate({ path: 'user', match: { email } });
    }
    query = query.sort({ scheduledDate: sort === 'asc' ? 1 : -1 });
    query = query.skip((page - 1) * limit).limit(Number(limit));
    const pickups = await query.exec();
    // Remove pickups with null user if email filter applied
    const filteredPickups = email ? pickups.filter(p => p.user) : pickups;
    res.status(200).json(filteredPickups);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get pickups for logged-in user
exports.getUserPickups = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, startDate, endDate, sort = 'desc' } = req.query;
    let filter = { user: req.user._id };
    if (status) filter.status = status;
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0,0,0,0);
      const end = new Date(endDate);
      end.setHours(23,59,59,999);
      filter.scheduledDate = { $gte: start, $lte: end };
    } else if (startDate) {
      const start = new Date(startDate);
      start.setHours(0,0,0,0);
      const end = new Date(startDate);
      end.setHours(23,59,59,999);
      filter.scheduledDate = { $gte: start, $lte: end };
    }
    let query = Pickup.find(filter);
    query = query.sort({ scheduledDate: sort === 'asc' ? 1 : -1 });
    query = query.skip((page - 1) * limit).limit(Number(limit));
    const pickups = await query.exec();
    res.status(200).json(pickups);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get a single pickup by ID
exports.getPickupById = async (req, res) => {
  try {
    const pickup = await Pickup.findById(req.params.id).populate('user', 'name email');
    if (!pickup) {
      return res.status(404).json({ message: 'Pickup not found' });
    }
    res.status(200).json(pickup);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Update a pickup (address, scheduledDate, status)
exports.updatePickup = async (req, res) => {
  try {
    const { address, scheduledDate, status } = req.body;
    const pickup = await Pickup.findById(req.params.id);
    if (!pickup) {
      return res.status(404).json({ message: 'Pickup not found' });
    }
    // Only allow user or admin to update
    if (pickup.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (address) pickup.address = address;
    if (scheduledDate) pickup.scheduledDate = scheduledDate;
    if (status) pickup.status = status;
    await pickup.save();
    res.status(200).json(pickup);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Delete a pickup
exports.deletePickup = async (req, res) => {
  try {
    const pickup = await Pickup.findById(req.params.id);
    if (!pickup) {
      return res.status(404).json({ message: 'Pickup not found' });
    }
    // Only allow user or admin to delete
    if (pickup.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await pickup.remove();
    res.status(200).json({ message: 'Pickup deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
