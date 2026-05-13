import usersDbConn from '../sequelize.js'
import AccountDetailsMeta from './AccountDetails.js'
import OneTimePasscodesMeta from './OneTimePasscodes.js'
import SavedAddressMeta from './SavedAddress.js'
import UserMeta from './User.js'

const User = usersDbConn.define('Users', UserMeta.attributes, UserMeta.options)
const AccountDetails = usersDbConn.define('AccountDetails', AccountDetailsMeta.attributes, AccountDetailsMeta.options)
const SavedAddress = usersDbConn.define('SavedAddress', SavedAddressMeta.attributes, SavedAddressMeta.options)
const OneTimePasscodes = usersDbConn.define(
  'OneTimePasscodes',
  OneTimePasscodesMeta.attributes,
  OneTimePasscodesMeta.options,
)

// you can define relationships here

export default { AccountDetails, OneTimePasscodes, SavedAddress, User }
