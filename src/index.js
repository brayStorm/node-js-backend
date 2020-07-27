const express = require('express');
const cors = require('cors');
const app = express();
const passport = require('passport');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const db = require('./db/models');
const cron = require('node-cron');

const {exec} = require('child_process');

const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/file');
const userRoutes = require('./routes/user');
const analytics = require('./routes/analytics');
const products = require('./routes/products');

app.use(cors({origin: true}));

app.use(helmet());

require('./auth/auth');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use('/api/auth', authRoutes);
app.use('/api/file', fileRoutes);
app.use('/api/products', passport.authenticate("jwt", {session: false}), products);
app.use('/api/analytics', passport.authenticate("jwt", {session: false}), analytics);
app.use('/api/users', passport.authenticate('jwt', {session: false}), userRoutes);

app.use(express.static('public'));

const PORT = process.env.PORT || 8080;

db.sequelize.sync().then(function () {
  app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  });
  cron.schedule('0 0 */1 * * *', () => {
    exec('yarn reset', (err) => {
      if (err) {
        console.error(err);
      }
    });
  });
});

module.exports = app;
