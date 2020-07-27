const express = require('express');

const UserService = require('../services/user');
const UserDBApi = require('../db/api/user');
const wrapAsync = require('../helpers').wrapAsync;

const router = express.Router();

router.post('/', wrapAsync(async (req, res) => {
  await UserService.create(req.body.data, req.currentUser, true, req.headers.referer);
  const payload = true;
  res.status(200).send(payload);
}));

router.put('/:id', wrapAsync(async (req, res) => {
  await UserService.update(req.body.data, req.body.id, req.currentUser);
  const payload = true;
  res.status(200).send(payload);
}));

router.delete('/:id', wrapAsync(async (req, res) => {
  await UserService.remove(req.params.id, req.currentUser);
  const payload = true;
  res.status(200).send(payload);
}));

router.get('/', wrapAsync(async (req, res) => {
  const payload = await UserDBApi.findAll(
    req.query,
  );

  res.status(200).send(payload);
}));
router.get('/autocomplete', async (req, res) => {
  const payload = await UserDBApi.findAllAutocomplete(
    req.query.query,
    req.query.limit,
  );

  res.status(200).send(payload);
});

router.get('/:id', wrapAsync(async (req, res) => {
  const payload = await UserDBApi.findBy(
    { id: req.params.id },
  );

  res.status(200).send(payload);
}));

router.use('/', require('../helpers').commonErrorHandler);

module.exports = router;
