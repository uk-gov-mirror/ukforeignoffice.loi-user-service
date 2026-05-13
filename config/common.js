import environment from './environment.js'

export const config = () => {
  const _node_env = process.env.NODE_ENV || 'development'
  return environment //[node_env];
}

export default { config }
