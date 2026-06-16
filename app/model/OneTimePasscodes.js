export const attributes = {
  user_id: {
    type: 'integer',
    primaryKey: true,
    allowNull: false,
  },
  passcode: {
    type: 'timestamp',
    allowNull: false,
  },
  passcode_expiry: {
    type: 'date',
    allowNull: false,
  },
}

export const options = {
  freezeTableName: true,
  // disable createdAt and updatedAt columns
  timestamps: false,
}

export default { attributes, options }
