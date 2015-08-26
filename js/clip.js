var Clip = function(text) {
  this.title = text.split('\n')[0]
  this.text = text.split('\n').join(' ⏎ ')

}