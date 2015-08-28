var clips = []
var oslWindow = null

// primarily for development, but so when the page
// reloads we don't get two tray icons
window.addEventListener('beforeunload', function() {
  tray.remove()
})

var $closeButton = document.getElementById('closeButton')
$closeButton.addEventListener('mousedown', function(e) {
  $closeButton.classList.add('down')
  $closeButton.setAttribute('data-timeout', setTimeout(function(){
    win.close()
    win.close(true)
    closeWelcomeWindow()
  }, 1000))
  $closeButton.setAttribute('data-time', Date.now())
})

$closeButton.addEventListener('mouseup', function(e) {
  $closeButton.classList.remove('down')
  clearTimeout($closeButton.getAttribute('data-timeout'))
  // hide the window if it hasn't been too long
  if (Date.now() - $closeButton.getAttribute('data-time') < 250) {
    if (document.body.classList.contains('settings'))
      closeAndSaveSettings()
    else
      win.close()
  }
})
$closeButton.addEventListener('mouseleave', function(e) {
  $closeButton.classList.remove('down')
  clearTimeout($closeButton.getAttribute('data-timeout'))
  // don't do anything, no matter how long it's been
})

var $settingsButton = document.getElementById('settingsButton')
$settingsButton.addEventListener('click', function() {
  if (document.body.classList.contains('settings')) {
    closeAndSaveSettings()
  } else {
    document.body.classList.add('settings')
    document.getElementById('showsOnLaunch').focus()
  }
})
win.on('close', closeAndSaveSettings)
var resizeST
win.on('resize', function() {
  clearTimeout(resizeST)
  resizeST = setTimeout(function() {
    win.hide()
    win.show()
  }, 500)
})
function nextMode() {
  var $content = document.querySelector('.content')
  var mode = $content.getAttribute('data-activemode')
  switch (mode) {
    case 'chars':
      $content.setAttribute('data-activemode', 'bytes')
      break
    case 'bytes':
      $content.setAttribute('data-activemode', 'words')
      break
    case 'words':
      $content.setAttribute('data-activemode', 'lines')
      break
    case 'lines':
      $content.setAttribute('data-activemode', 'chars')
  }
}

if (localStorage.firstRun) {
  start()
}

function start() {
  updateWindowDisplay()

  var pinnedClips = JSON.parse(localStorage.pinnedClips || '[]')
  pinnedClips.forEach(function(pinnedClip) {
    var clip = new Clip(pinnedClip.text, pinnedClip.date, true)
    clip.language = pinnedClip.language
    clip.title = pinnedClip.title
    clip.regenerateListItem()
    clip.rehighlight()
    clips.push(clip)
    listener.lastClip.push(pinnedClip.text)
  })

  clips.forEach(function(clip) {
    document.querySelector('ul').insertBefore(clip.aNode, document.querySelector('ul').children[0])
  })

  listener.emitter.on('clip', function(clipText) {
    var clip = new Clip(clipText)
    document.querySelector('ul').insertBefore(clip.aNode, document.querySelector('ul').children[0])
    clips.push(clip)
  })

  if (localStorage.showsOnLaunch === 'true') {
    listener.listen(Number(localStorage.foregroundDelay))
  } else {
    listener.listen(Number(localStorage.backgroundDelay))
  }
}

win.on('close', windowClosed)
function windowClosed() {
  if (oslWindow) oslWindow.close()

  clips = clips.filter(function(clip) {
    clip.aNode.remove()
    return !clip.deleted
  })

  var pinnedClips = []
  clips.forEach(function(clip) {
    if (clip.pinned === true) {
      pinnedClips.push({
        text: clip.text,
        title: clip.title,
        date: clip.momentCreated.format(),
        language: clip.language
      })
    }
  })
  localStorage.pinnedClips = JSON.stringify(pinnedClips)

  clips.forEach(function(clip) {
    document.querySelector('ul').insertBefore(clip.aNode, document.querySelector('ul').children[0])
  })

  listener.listen(Number(localStorage.backgroundDelay))
}
win.on('focus', windowUpdate)
function windowUpdate() {
  clips.forEach(function(clip) {
    clip.regenerateListItem()
  })
  listener.listen(Number(localStorage.foregroundDelay))
}

function updateWindowDisplay() {
  document.body.classList.remove('opaque', 'noHoverEffect', 'code-wrap', 'code-light')
  ;(document.querySelector('link[href^="node_modules"]')||{remove:function(){}}).remove()
  // behavior
  document.getElementById('showsOnLaunch').checked = (localStorage.showsOnLaunch === 'true')
  // appearance
  if (localStorage.alwaysOpaque === 'true') {
    document.body.classList.add('opaque')
    document.getElementById('opaque').checked = true
  } else {
    document.getElementById('opaque').checked = false
  }
  if (localStorage.hoverEffect === 'false') {
    document.body.classList.add('noHoverEffect')
    document.getElementById('disableHover').checked = true
  } else {
    document.getElementById('disableHover').checked = false
  }
  // new clips
  document.getElementById('trimClips').checked = (localStorage.trimClips === 'true')
  document.getElementById('noWhitespace').checked = (localStorage.noWhitespace === 'true')
  // language detection
  document.getElementById('primaryLanguages').value = JSON.parse(localStorage.languages).filter(function(lang) {
    return (lang !== 'text')
  }).join(', ')
  document.getElementById('requiredRelevance').value = localStorage.requiredRelevance
  // syntax highlighting
  ;([].filter.call(document.querySelectorAll('#codeHighlight option'), function($opt) {
    return ($opt.innerText === localStorage.codeHighlight)
  })[0]||{setAttribute:function(){}}).setAttribute('selected', true)
  var $highlight = document.createElement('link')
  $highlight.setAttribute('rel', 'stylesheet')
  $highlight.setAttribute('href', 'node_modules/highlight.js/styles/' +
                                  localStorage.codeHighlight + '.css')
  document.querySelector('head').appendChild($highlight)
  if (localStorage.codeDark === 'false') {
    document.body.classList.add('code-light')
    document.getElementById('codeDark').checked = false
  } else {
    document.getElementById('codeDark').checked = true
  }
  if (localStorage.codeWraps === 'true') {
    document.body.classList.add('code-wrap')
    document.getElementById('codeWraps').checked = true
  } else {
    document.getElementById('codeWraps').checked = false
  }
  // clipboard updates
  document.getElementById('foregroundDelay').value = localStorage.foregroundDelay
  document.getElementById('backgroundDelay').value = localStorage.backgroundDelay

  // reset buttons
  document.getElementById('clearDefaults').innerHTML = 'Reset all settings to defaults&hellip;'
  document.getElementById('clearAll').innerHTML = 'Clear all data and quit&hellip;'
}

// SETTINGS

function closeAndSaveSettings() {
  var e = [], rr, fd, bd
  ;[].forEach.call(document.querySelectorAll('.settingsPanel .error'), function($elem) {
    $elem.remove()
  })
  localStorage.showsOnLaunch = document.getElementById('showsOnLaunch').checked
  localStorage.alwaysOpaque = document.getElementById('opaque').checked
  localStorage.hoverEffect = !document.getElementById('disableHover').checked
  localStorage.trimClips = document.getElementById('trimClips').checked
  localStorage.noWhitespace = document.getElementById('noWhitespace').checked
  var selectedLangs = ['text'], wasError = false
  document.getElementById('primaryLanguages').value
    .split(',')
    .map(function(s){return s.trim()})
    .map(function(s){return s.toLowerCase()})
    .filter(Boolean) // remove any empty strings
    .forEach(function(text) {
      if (~LANGUAGES.indexOf(text)) {
        selectedLangs.push(text)
      } else {
        e.push('"' + text + '" is not a recognized language.')
        wasError = true
      }
    })
  if (wasError) {
    document.getElementById('primaryLanguages').value = selectedLangs.filter(function(lang) {
      return (lang !== 'text')
    }).join(', ')
  } else {
    localStorage.languages = JSON.stringify(selectedLangs)
  }
  var rr = parseInt(document.getElementById('requiredRelevance').value)
  if (rr >= -1 && rr <= 255) {
    localStorage.requiredRelevance = rr
  } else {
    e.push('Required relevance must be a number between -1 and 255.')
  }
  localStorage.codeHighlight = document.getElementById('codeHighlight').value
  localStorage.codeDark = document.getElementById('codeDark').checked
  localStorage.codeWraps = document.getElementById('codeWraps').checked
  var fd = parseInt(document.getElementById('foregroundDelay').value)
    if (fd >= 1 && fd <= 360) {
    localStorage.foregroundDelay = fd
  } else {
    e.push('Foreground delay must be a number between 1 and 360.')
  }
  var bd = parseInt(document.getElementById('backgroundDelay').value)
    if (bd >= 1 && bd <= 360) {
    localStorage.backgroundDelay = bd
  } else {
    e.push('Background delay must be a number between 1 and 360.')
  }
  if (e.length === 0) {
    // saving and stuff, etc.
    updateWindowDisplay()
    document.body.classList.remove('settings')
  } else {
    displaySettingsError(e)
  }
}
document.getElementById('clearDefaults').addEventListener('click', function() {
  if (this.innerText.indexOf('R') === 0) {
    this.innerText = 'Are you sure? Click to reset all settings.'
  } else {
    setDefaults()
    updateWindowDisplay()
    document.querySelector('.settingsPanel').scrollTop = 0
    displaySettingsError(['All settings reset.'], true)
  }
})
document.getElementById('clearAll').addEventListener('click', function() {
  if (this.innerText.indexOf('C') === 0) {
    this.innerHTML = 'Are you sure?<br><br><strong>Click to clear all data, including pinned clips.</strong>'
  } else {
    win.close(true)
    localStorage.clear()
  }
})
function displaySettingsError(e, noPre) {
  $error = document.createElement('div')
  $error.classList.add('error')
  $error.innerHTML = (noPre ? '' : ('The following error' + (e.length > 1 ? 's' : '') +
                     ' occured:<br>')) + e.join('<br>')
  document.querySelector('.settingsPanel').insertBefore(
    $error,
    document.querySelector('.settingsPanel').children[0]
  )
  $errorClone = $error.cloneNode(true)
  $errorClone.classList.add('spacer')
  document.querySelector('.settingsPanel').insertBefore($errorClone, $error)
}

function showOSL() {
  if (oslWindow) return oslWindow.focus()
  oslWindow = gui.Window.open('osl.html', {
    title: 'Open Source Licenses',
    toolbar: false,
    position: 'center',
    width: 700,
    height: 600,
    resizable: true
  })
}