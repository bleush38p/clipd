var gui = require('nw.gui')
var win = gui.Window.get()
var windowShowing = false
var menubar = new gui.Menu({
  type: 'menubar'
})
menubar.createMacBuiltin('clipd')
var appmenu = new gui.Menu()
appmenu.append(new gui.MenuItem({
  // this should just hide clipd
  label: 'Hide clipd',
  key: 'h',
  modifiers: 'cmd',
  click: function() {
    win.close()
  }
}))
appmenu.append(new gui.MenuItem({
  // this needs to /actually/ quit clipd
  label: 'Quit clipd',
  key: 'q',
  modifiers: 'cmd',
  click: function () {
    win.close()
    win.close(true)
    closeWelcomeWindow()
  }
}))
appmenu.append(new gui.MenuItem({
  label: 'Developer tools',
  key: 'i',
  modifiers: 'cmd-alt',
  click: function () {
    win.showDevTools()
  }
}))
// replace the macbuiltin application menu
// with the cheaty one we already made
menubar.items[0].submenu = appmenu
win.menu = menubar

win.on('close', function () {
  // closing the window (cmd w) shouldn't quit the application
  windowShowing = false
  win.hide()
})


// set up a clipboard icon in the tray
var tray = new gui.Tray({
  icon: 'img/icon.png'
})

tray.on('click', function() {
  if (windowShowing) {
    win.close()
  } else {
    closeWelcomeWindow()
    windowShowing = true
    win.show()
    win.focus()
  }
})

global.mouse = {}
window.addEventListener('mousemove', function(e) {
  global.mouse.x = e.screenX
  global.mouse.y = e.screenY
})

global.didCopy = function() {
  return gui.Window.open('copied.html', {
    title: '',
    frame: false,
    toolbar: false,
    width: 200,
    height: 20,
    transparent: true,
    resizable: false,
    show: false,
    "always-on-top": true
  })
}


var welcomeWindow
function openWelcomeWindow() {
  welcomeWindow = gui.Window.open('welcome.html', {
    toolbar: false,
    position: 'center',
    width: 580,
    height: 460,
    resizable: false,
    show: false,
    fullscreen: false
  })
  welcomeWindow.on('close', function() {
    welcomeWindow.close(true)
    win.close(true)
  })
  setTimeout(function() {
    welcomeWindow.show()
    welcomeWindow.focus()
  }, 250)
}
function closeWelcomeWindow() {
  if (welcomeWindow) {
    welcomeWindow.close(true)
    localStorage.firstRun = 'complete'
    localStorage.backgroundDelay = 15
    localStorage.foregroundDelay = 2
    localStorage.alwaysOpaque = false
    localStorage.hoverEffect = true
    localStorage.languages = JSON.stringify(['apache', 'bash', 'coffeescript', 'cpp', 'cs', 'css', 'diff', 'http', 'ini', 'java', 'javascript', 'json', 'makefile', 'markdown', 'nginx', 'obj-c', 'perl', 'php', 'python', 'ruby', 'sql', 'xml'])
    localStorage.requiredRelevance = 8
    localStorage.trimClips = true
    localStorage.noWhitespace = true
    welcomeWindow = null
  }
}

windowShowing = false /*
/*/ win.hide /*/
windowShowing = true
win.show()
win.focus() /**/

if (!localStorage.firstRun) {
  openWelcomeWindow()
}