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
function closeAndSaveSettings() {
  // saving and stuff, etc.
  document.body.classList.remove('settings')
}

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
  console.log('start!')
  var pinnedClips = JSON.parse(localStorage.pinnedClips) || []
  console.log(localStorage.pinnedClips)
  console.log(pinnedClips)
  pinnedClips.forEach(function(pinnedClip) {
    var clip = new Clip(pinnedClip.text, pinnedClip.date, true)
    clip.language = pinnedClip.language
    clip.regenerateListItem()
    clip.rehighlight()
    clips.push(clip)
  })
  console.log(clips)

  clips.forEach(function(clip) {
    document.querySelector('ul').insertBefore(clip.aNode, document.querySelector('ul').children[0])
  })

  listener.emitter.on('clip', function(clipText) {
    var clip = new Clip(clipText)
    document.querySelector('ul').insertBefore(clip.aNode, document.querySelector('ul').children[0])
    clips.push(clip)
  })
  listener.listen(Number(localStorage.backgroundDelay))
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