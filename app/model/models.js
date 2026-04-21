const UserMeta = require('./User.js')
const AccountDetailsMeta = require('./AccountDetails.js')
const SavedAddressMeta = require('./SavedAddress.js')
const OneTimePasscodesMeta = require('./OneTimePasscodes.js')
const usersDbConn = require('../sequelize.js')
const User = usersDbConn.define('Users', UserMeta.attributes, UserMeta.options)
const AccountDetails = usersDbConn.define('AccountDetails', AccountDetailsMeta.attributes, AccountDetailsMeta.options)
const SavedAddress = usersDbConn.define('SavedAddress', SavedAddressMeta.attributes, SavedAddressMeta.options)
const OneTimePasscodes = usersDbConn.define(
  'OneTimePasscodes',
  OneTimePasscodesMeta.attributes,
  OneTimePasscodesMeta.options,
)

// you can define relationships here

module.exports.User = User
module.exports.AccountDetails = AccountDetails
module.exports.SavedAddress = SavedAddress
module.exports.OneTimePasscodes = OneTimePasscodes
