const { createElement } = require('react');

module.exports = function Link({ href, children }) {
  return createElement('a', { href }, children);
};
