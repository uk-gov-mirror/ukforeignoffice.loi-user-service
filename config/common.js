import environment from './environment.js'

export const config = () => {
  const _node_env = process.env.NODE_ENV || 'development'
  return environment //[node_env];
}

export const validations = {
  emailRegex:
    /^(?!.*\.\.)[a-z0-9!#$%&'*+/=?^_\x60{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_\x60{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i,
}

export default { config, validations }
