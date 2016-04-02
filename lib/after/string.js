'use strict'

const base64url = require('urlsafe-base64')
const After = require('json-list-response').After
const inherits = require('util').inherits

module.exports = StringAfter

function StringAfter(value, options) {
  After.call(this, value, options)

  this.skip = 0
  this.value = 0

  if (value) {
    value = base64url.decode(value)
    this.skip = value.readUInt8(0)
    this.value = value.toString('utf8', 1)
  }
}
inherits(StringAfter, After)

StringAfter.prototype.add = function(row) {
  const value = String(row[this.key])
  if (!value) return

  if (this.value === value) {
    this.skip++
  } else {
    this.skip = 0
    this.value = value
  }
}

StringAfter.prototype.toString = function() {
  if (!this.value) return ''

  const buf = new Buffer(1 + Buffer.byteLength(this.value))
  buf.writeUInt8(this.skip, 0)
  buf.write(this.value, 1)

  return base64url.encode(buf)
}

StringAfter.prototype.mongoSorting = function(list, sorting) {
  const obj =
    { [sorting.key]:
      { [sorting.descending ? '$lte' : '$gte']: this.value
      }
    }
  list.selector.$and.push(obj)
  list.cursor.skip(this.skip + 1)
}
