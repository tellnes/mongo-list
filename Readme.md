# mongo-list

mongo-list

## Example

```js
var collection = db.collection('resource')

app.get('/resource', function (req, res, next) {
  var list = new MongoList(
      { query: req.query
      , collection: collection
      , selector: { user: req.user.id }
      , transform: function (doc, cb) {
          var json =
            { id: doc._id
            , name: doc.name
            }
          cb(null, json)
        }
      , base: 'https://api.example.com/resource'
      , sorting:
        { descending: true
        , key: '_id'
        , transformed: 'id'
        , type: 'ObjectID'
        }
      }
    )

  list.pipe(res)
})
```

## Install

    $ npm install mongo-list

## License

MIT
