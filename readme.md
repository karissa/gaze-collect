# gaze-collect

Watches files for you and outputs all the changed files as they change.

[![NPM](https://nodei.co/npm/gaze-collect.png)](https://nodei.co/npm/gaze-collect/)

```js
var Collector = require('gaze-collect')
var watcher = Collector(['/path/to/dir', '/another/path/to/watched/dir'])

watcher.on('data', function (data) {
  // data is a list of the contents of each runtime as a JSON object
  // e.g. [
  // {
  //   "filepath": "/path/to/dir/another/file",
  //   "data": {etc..}
  //  }
  // ]
  //
})

watcher.close()
```

## API

### Collector(dirs, opts)

Returns a watcher

`dirs`: the directories to watch

#### opts

- takes any options for the [Gaze](https://github.com/shama/gaze) object
- also includes:
  `read`: boolean. whether or not to read contents into the return object
  `valid`: function (filepath). returns true if filepath should be included. defauls to true

### watcher.close()

Closes the watcher -- stops watching the filesystem.

## Events

There should be more, but right now it just emits one event -- that's when the kernel spec (`kernel.json`) has changed.

### data

```js
watcher.on('data', function (data) {
  // list of data
})
```


