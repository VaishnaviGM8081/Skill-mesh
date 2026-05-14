const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
const workerRoutes = require('./routes/workerRoutes');
const customerRoutes = require('./routes/customerRoutes');
const jobRoutes = require('./routes/jobRoutes');

app.use('/api/workers', workerRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/jobs', jobRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'SkillMesh Backend Running' });
});

// Centralized Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
