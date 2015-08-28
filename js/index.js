var clips = []

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
  if (document.body.classList.contains('settings'))
    closeAndSaveSettings()
  else
    document.body.classList.add('settings')
})
win.on('close', closeAndSaveSettings)

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
  clips = clips.filter(function(clip) {
    clip.aNode.remove()
    return !clip.deleted
  })

  var pinnedClips = []
  clips.forEach(function(clip) {
    if (clip.pinned === true) {
      pinnedClips.push({
        text: clip.text,
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
  document.body.classList.remove('opaque', 'noHoverEffect')
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
  if (localStorage.codeWraps === 'true') {
    document.body.classList.add('code-wrap')
  }
  document.getElementById('showsOnLaunch').checked = (localStorage.showsOnLaunch === 'true')
  document.getElementById('trimClips').checked = (localStorage.trimClips === 'true')
  document.getElementById('noWhitespace').checked = (localStorage.noWhitespace === 'true')
  document.getElementById('foregroundDelay').value = localStorage.foregroundDelay
  document.getElementById('backgroundDelay').value = localStorage.backgroundDelay

}

// SETTINGS

function closeAndSaveSettings() {
  localStorage.showsOnLaunch = document.getElementById('showsOnLaunch').checked
  localStorage.alwaysOpaque = document.getElementById('opaque').checked
  localStorage.hoverEffect = !document.getElementById('disableHover').checked
  localStorage.trimClips = document.getElementById('trimClips').checked
  localStorage.noWhitespace = document.getElementById('noWhitespace').checked
  localStorage.foregroundDelay = document.getElementById('foregroundDelay').value
  localStorage.backgroundDelay = document.getElementById('backgroundDelay').value
  // saving and stuff, etc.
  updateWindowDisplay()
  document.body.classList.remove('settings')
}

document.getElementById('clearAll').addEventListener('click', function() {
  win.close(true)
  localStorage.clear()
})