const express = require('express');
const router = express.Router();

// Mock data responses for hackathon speed

router.post('/checkin', (req, res) => {
  res.json({ success: true, message: 'Check-in recorded' });
});

router.post('/health-aggregate', (req, res) => {
  res.json({ success: true, message: 'Health aggregate processed' });
});

router.post('/ivr-signal', (req, res) => {
  res.json({ success: true, message: 'IVR signal processed' });
});

router.get('/session-flag', (req, res) => {
  res.json({ success: true, flag: 'low', message: 'Session flag retrieved' });
});

router.post('/trigger-referral', (req, res) => {
  res.json({ success: true, message: 'Referral triggered' });
});

router.post('/visit-log', (req, res) => {
  res.json({ success: true, message: 'Visit logged' });
});

router.get('/district-stats', (req, res) => {
  res.json({ success: true, stats: { district: 'Central', activeUsers: 150, riskFlags: 5 } });
});

module.exports = router;
