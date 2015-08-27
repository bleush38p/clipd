(function(root) {
  var Events = require('events')
  var clipboard = require('nw.gui').Clipboard.get()

  var emitter = new Events()

  var listener = {
    listen: function listen(delay) {
      clearTimeout(listener.lastTimeout)

      var currentClipboard = clipboard.get()
      if (localStorage.trimClips === 'true') {
        currentClipboard = currentClipboard.trim()
      }
      if (currentClipboard &&
          (localStorage.noWhite === 'false' || currentClipboard.trim()) &&
          currentClipboard !== listener.lastClip) {
        listener.lastClip = currentClipboard
        emitter.emit('clip', currentClipboard)
      }

      listener.lastTimeout = setTimeout(listen, delay * 1000, delay)
    },
    stop: function() {
      clearTimeout(listener.lastTimeout)
    },
    lastTimeout: 0,
    lastClip: '',
    emitter: emitter
  }

  root.listener = listener
}(window))
