var fs = require('fs')
var Gaze = require('gaze').Gaze
var through = require('through2')
var from = require('from2')
var collect = require('collect-stream')
var inherits = require('inherits')
var events = require('events')
var debug = require('debug')('gaze-collect')
var path = require('path')

module.exports = GazeCollector
inherits(GazeCollector, events.EventEmitter)

function GazeCollector (dirs, opts) {
  if (!(this instanceof GazeCollector)) return new GazeCollector(dirs, opts)
  if (!opts) opts = {}

  var self = this

  events.EventEmitter.call(self)

  self.gaze = new Gaze(null, opts)
  self.valid = opts.valid || function (path) { return true }
  self.read = opts.read || true

  for (var i in dirs) {
    self.gaze.add(dirs[i])
    debug('added', dirs[i])
  }

  self.initial(dirs, function (err, nodes) {
    self.data = nodes
    self.emit('data', self.data)
  })

  self.gaze.on('deleted', function (filepath) {
    self.deleted(filepath)
  })

  self.gaze.on('changed', function (filepath) {
    self.update(filepath)
  })

  self.gaze.on('added', function (filepath) {
    self.update(filepath)
  })
}

GazeCollector.prototype.initial = function (dirs, cb) {
  var self = this

  var nodes = []
  var stream = from.obj(dirs).pipe(through.obj(function (dir, enc, next) {
    dir = path.dirname(dir)
    if (!fs.existsSync(dir)) return next()

    var contents = fs.readdirSync(dir)

    for (var i in contents) {
      var filepath = path.join(dir, contents[i])

      if (fs.statSync(filepath).isFile() && self.valid(filepath)) {
        self.get(filepath, function (err, node) {
          if (err) return next(err)
          next(null, node)
        })
      }
    }
  }))

  collect(stream, cb)
}

GazeCollector.prototype.deleted = function (filepath) {
  var self = this
  debug('deleted', filepath)

  for (var i in self.data) {
    if (self.data.filepath === filepath) {
      delete self.data[i]
      self.emit('data', self.data)
    }
  }
}

GazeCollector.prototype.update = function (filepath) {
  var self = this
  self.get(filepath, function (err, node) {
    if (err) return self.emit('error', err)

    self.data.push(obj)
    self.emit('data', self.data)
  })
}

GazeCollector.prototype.get = function (filepath, cb) {
  var self = this
  debug('get', filepath)
  if (self.valid(filepath)) {
    var obj = { filepath: filepath }
    if (!self.read) {
      cb(null, obj)
    }
    else {
      fs.readFile(filepath, function (err, contents) {
        if (err) cb(err)
        obj.data = contents.toString()
        try {
          if (self.parse) obj.data = JSON.parse(obj.data)
        } catch (err) {
          self.emit('err', new Error('Couldnt parse into JSON: ', obj.file))
        }
        cb(null, obj)
      })
    }
  }
}

GazeCollector.prototype.close = function () {
  this.gaze.close()
}