var JSONListResponse = require('json-list-response')
  , Readable = require('stream').Readable
  , Transform = require('stream').Transform
  , inherits = require('util').inherits

var after =
  { 'objectid': require('./lib/after/object-id')
  , 'date': require('./lib/after/date')
  }

module.exports = MongoList

function MongoList(options) {

  var sorting = options.sorting || { key: '_id', type: 'objectid' }

  options.sortKey = sorting.transformed || sorting.key

  sorting.type = sorting.type && sorting.type.toLowerCase() || null

  if (sorting.type && after[sorting.type]) {
    options.ObjectID = options.ObjectID || MongoList.ObjectID
    options.After = after[sorting.type]
  }

  JSONListResponse.call(this, options)

  this.selector = { $and: [] }

  if (options.selector) {
    this.selector.$and.push(options.selector)
  }

  this.cursor = options.collection.find(this.selector, options.fields || {})

  this.cursor.limit(this.query.limit + 1)


  var obj = {}
  obj[sorting.key] = sorting.descending ? -1 : 1
  this.cursor.sort(obj)

  if (this.query.after) {
    if (this.after.mongoSorting) {
      this.after.mongoSorting(this, sorting)
    } else {
      obj = {}
      obj[sorting.key] = {}
      obj[sorting.key][sorting.descending ? '$lt' : '$gt'] = this.after.value
      this.selector.$and.push(obj)
    }
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
