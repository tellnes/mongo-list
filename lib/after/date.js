var base64url = require('urlsafe-base64')
  , After = require('json-list-response').After
  , inherits = require('util').inherits

module.exports = DateAfter

function DateAfter(value, options) {
  After.call(this, value, options)

  this.skip = 0
  this.value = 0

  if (value) {
    value = base64url.decode(value)
    if (value.length === 9) {
      this.value = value.readDoubleBE(0)
      this.skip = value.readUInt8(8)
    }
  }
}
inherits(DateAfter, After)

DateAfter.prototype.add = function (row) {
  var value = row[this.key]
  if (!value) return

  if (+this.value === +value) {
    this.skip++
  } else {
    this.skip = 0
    this.value = value
  }
}

DateAfter.prototype.toString = function () {
  if (!this.value) return ''

  var buf = new Buffer(9)

  buf.writeDoubleBE(+this.value || 0, 0)
  buf.writeUInt8(this.skip, 8)

  return base64url.encode(buf)
}

DateAfter.prototype.mongoSorting = function (list, sorting) {
  var obj = {}
  obj[sorting.key] = {}
  obj[sorting.key][sorting.descending ? '$lte' : '$gte'] = new Date(this.value)
  list.selector.$and.push(obj)
  list.cursor.skip(this.skip + 1)
}
