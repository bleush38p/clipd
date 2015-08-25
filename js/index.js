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
    win.close()
  }
})
$closeButton.addEventListener('mouseleave', function(e) {
  $closeButton.classList.remove('down')
  clearTimeout($closeButton.getAttribute('data-timeout'))
  // don't do anything, no matter how long it's been
})