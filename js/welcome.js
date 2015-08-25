var body = document.body,
    bcl = body.classList

document.getElementById('next').addEventListener("click", function() {
  if (bcl.contains('on-page0')) {
    bcl.remove('on-page0')
    bcl.add('on-page1')
    document.querySelector('#next span').innerHTML = 'The <i class="material-icons">content_paste</i> icon on the status bar (top right) shows clipd\'s window. Pressing it will close this window.'
  }
})