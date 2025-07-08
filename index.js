require('./Schedule.js');
const express = require('express');
const app = express();
const cors = require('cors');
const { connect } = require('./connectDB.js');
const userRouter = require('./Routes/UserRoute.js');
const { plantRouter } = require('./Routes/PlantRoute.js');
require('dotenv').config()
connect();
app.use(express.json());
app.use(cors());

app.use('/api/user', userRouter);
app.use('/api/plant', plantRouter);

app.get('/', (req, res) => {
  res.send('<h1> Testing</h1>');
});

app.use((err, req, res, next) => {
  res.status(500).json({ message: 'Something went wrong', error: err.message });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`App listening on port ${process.env.PORT || 3000}`);
});
