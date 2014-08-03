var After = require('json-list-response').After
  , inherits = require('util').inherits

module.exports = ObjectIDAfter

function ObjectIDAfter(value, options) {
  After.call(this, value, options)

  if (this.value) {
    try {
      this.value = new options.ObjectID(this.value)
    } catch (err) {
      this.value = null
    }
  }
}
inherits(ObjectIDAfter, After)
