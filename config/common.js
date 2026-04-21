const environment = require('./environment.js')
exports.config = () => {
  const _node_env = process.env.NODE_ENV || 'development'
  return environment //[node_env];
}
