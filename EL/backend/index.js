const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'SkillMesh Backend Running' });
});

const workerRoutes = require('./routes/workerRoutes');
const gatewayRoutes = require('./routes/gatewayRoutes');
const jobRoutes = require('./routes/jobRoutes');
const adminRoutes = require('./routes/adminRoutes');

// APIs will be mounted here
app.use('/api/workers', workerRoutes);
app.use('/api/gateway', gatewayRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
