var JSONListResponse = require('json-list-response')
  , Readable = require('stream').Readable
  , Transform = require('stream').Transform
  , inherits = require('util').inherits

module.exports = MongoList

function MongoList(options) {
  var sortKey = options.sortKey || '_id'
    , sortDir = options.descending ? -1 : 1
    , obj

  options.sortKey = options.transformedSortKey || sortKey

  JSONListResponse.call(this, options)

  this.selector = { $and: [] }

  if (options.selector) {
    this.selector.$and.push(options.selector)
  }

  this.cursor = options.collection.find(this.selector, options.fields || {})

  this.cursor.limit(this.query.limit + 1)


  obj = {}
  obj[sortKey] = sortDir
  this.cursor.sort(obj)

  if (this.query.after) {
    obj = {}
    obj[sortKey] = {}
    obj[sortKey][sortDir < 0 ? '$lte' : '$gte'] = this.after.value
    this.selector.$and.push(obj)
    this.cursor.skip(this.after.skip + 1)
  }

  var cursorStream = (new Readable({ objectMode: true })).wrap(this.cursor.stream())

  if (options.transform) {
    var trans = options.transform
    if (typeof trans === 'function') {
      trans = new AsyncTransform(trans)
    }
    cursorStream.pipe(trans).pipe(this)

  } else {
    cursorStream.pipe(this)
  }
}
inherits(MongoList, JSONListResponse)


module.exports.AsyncTransform = AsyncTransform

function AsyncTransform(fn) {
  if (!(this instanceof AsyncTransform)) return new AsyncTransform(fn)
  Transform.call(this, { objectMode: true })
  if (fn) this.transformer = fn
}
inherits(AsyncTransform, Transform)

AsyncTransform.prototype._transform = function (obj, enc, cb) {
  var self = this
  this.transformer(obj, function (err, obj) {
    if (err) return cb(err)
    self.push(obj)
    cb()
  })
}
