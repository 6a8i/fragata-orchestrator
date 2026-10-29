module.exports = require('../../@fragata/babel-config')(require('./package.json'), {
  '@babel/preset-env': {
    modules: false,
  },
})
