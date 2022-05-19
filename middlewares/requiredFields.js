function requiredFields(fields = []) {
  return async function (req, res, next) {
    try {
      for (const field of fields) {
        if (!(field in req.body)) {
          return res.send('missing required field ' + field);
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = requiredFields;
