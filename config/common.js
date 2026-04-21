/**
 * Created by preciousr on 07/01/2016.
 */
var environment = require('./environment.js')
exports.config = () => {
  var node_env = process.env.NODE_ENV || 'development'
  return environment //[node_env];
}
