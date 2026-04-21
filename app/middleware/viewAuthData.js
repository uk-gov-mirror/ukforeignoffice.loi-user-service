const Model = require('../model/models')

module.exports = async function viewAuthData(req, res, next) {
  try {
    res.locals.isAuthenticated = false
    res.locals.user = null
    res.locals.account = null

    if (typeof req.isAuthenticated === 'function' && req.isAuthenticated() && req.user) {
      const user = req.user.dataValues ? req.user.dataValues : req.user
      let account = req.session ? req.session.account : null

      if (!account || account.user_id !== user.id) {
        const accountFromDb = await Model.AccountDetails.findOne({ where: { user_id: user.id } })
        account = accountFromDb ? accountFromDb.dataValues : null
      }

      res.locals.isAuthenticated = true
      res.locals.user = user
      res.locals.account = account || null

      if (req.session) {
        req.session.user = user
        req.session.account = account || null
      }
    }

    return next()
  } catch (error) {
    return next(error)
  }
}
