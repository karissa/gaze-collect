var fs = require('fs')
var Gaze = require('gaze').Gaze
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

  self.data = []
  self.gaze = new Gaze(null, opts)
  self.valid = opts.valid || function (path) { return true }
  self.read = opts.read || true

  for (var i in dirs) {
    self.gaze.add(dirs[i])
    debug('added', dirs[i])
  }

  var valid = self.valid

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
  debug('update', filepath)
  if (self.valid(filepath)) {
    var obj = { filepath: filepath }
    if (!self.read) {
      self.data.push(obj)
      self.emit('data', self.data)
    }
    else {
      fs.readFile(filepath, function (err, contents) {
        if (err) self.emit('error', err)
        try {
          obj.data = contents.toString()
          self.data.push(obj)
          self.emit('data', self.data)
        } catch (err) {
          self.emit('error', err)
        }
      })
    }
  }
}

GazeCollector.prototype.close = function () {
  this.gaze.close()
}