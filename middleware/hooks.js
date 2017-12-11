module.exports = (hooksConfig) => (req, res, next) => {
  if (hooksConfig) {
    for (var i = 0; i < hooksConfig.length; i++) {
      const hook = hooksConfig[i];

      if (hook.method.toUpperCase() == req.method && new RegExp(hook.path, 'g').test(req.originalUrl)) {
        return res.status(hook.response.status||200).send(hook.response.data).end();
      }
    }
  }

  next();
};
