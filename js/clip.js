(function(root) {

  // htmlcollection.forEach *fill
  HTMLCollection.prototype.forEach = Array.prototype.forEach

  var hljs = require('highlight.js')
  var clipboard = require('nw.gui').Clipboard.get()
  var moment = require('moment')
  var Events = require('events')

  // byte length of string: http://codereview.stackexchange.com/a/37552
  function getByteLen(normal_val) {
    // Force string type
    normal_val = String(normal_val);

    var byteLen = 0;
    for (var i = 0; i < normal_val.length; i++) {
      var c = normal_val.charCodeAt(i);
      byteLen += c < (1 <<  7) ? 1 :
                 c < (1 << 11) ? 2 :
                 c < (1 << 16) ? 3 :
                 c < (1 << 21) ? 4 :
                 c < (1 << 26) ? 5 :
                 c < (1 << 31) ? 6 : Number.NaN;
    }
    return byteLen;
  }

  var Clip = function(text, timeString, pinned) {
    var _this = this
    this.emitter = new Events()
    this.on = this.emitter.on
    this.title = text.split('\n')[0]
    this.text = text
    this.displayText = text.split('\n').join(' ⏎ ')
    highlighted = hljs.highlightAuto(text, JSON.parse(localStorage.languages))
    if (highlighted.relevance >= Number(localStorage.requiredRelevance)) {
      this.language = highlighted.language
      this.highlightedHTML = highlighted.value
    } else {
      this.language = 'text'
      var $e = document.createElement('div')
      $e.innerText = this.text
      this.highlightedHTML = $e.innerHTML
      $e = null
    }
    this.stats = {
      chars: text.length,
      bytes: getByteLen(text),
      words: text.split(/\s+/).length,
      lines: text.split('\n').length
    }
    this.deleted = false
    this.pinned = pinned || false
    this.momentCreated = moment(timeString)

    this.togglePinned = function(event) {
      this.blur()
      if (_this.pinned) {
        _this.pinned = false
        _this.liNode.classList.remove('pinned')
      } else  {
        _this.pinned = true
        _this.liNode.classList.add('pinned')
      }
    }
    this.copyToClipboard = function() {
      this.blur()
      if (listener) listener.lastClip = _this.text
      clipboard.set(_this.text)
      global.didCopy()
    }
    this.deleteNode = function() {
      if (_this.deleted) {
        _this.deleted = false
        _this.regenerateListItem()
      } else {
        _this.deleted = true
        _this.liNode.children[0].innerHTML = 'this clip will be removed when the clipd window is closed &bull; '
        var $button = document.createElement('button')
        $button.classList.add('switcher')
        $button.addEventListener('click', _this.deleteNode)
        $button.innerText = 'undelete'
        _this.liNode.children[0].appendChild($button)
        _this.liNode.children[1].remove()
        // don't increment: since one's been removed, they all move over
        _this.liNode.children[1].remove()
        _this.liNode.children[1].remove()
      }
    }

    this.generateA()
    this.generateLi()

    this.aNode.appendChild(this.liNode)

  }

  Clip.prototype.getElapsedTime = function() {
    return this.momentCreated.fromNow()
  }
  Clip.prototype.getTime = function() {
    return this.momentCreated.calendar()
  }

  Clip.prototype.rehighlight = function() {
    if (this.language === 'text') {
      var $e = document.createElement('div')
      $e.innerText = this.text
      this.highlightedHTML = $e.innerHTML
      $e = null
    } else {
      this.highlightedHTML = hljs.highlight(this.language, this.text, true).value
    }
  }

  Clip.prototype.generateA = function() {
    var $aNode = document.createElement('a')
    $aNode.setAttribute('href', '#')
    if (this.pinned) {
      $aNode.classList.add('pinned')
    }
    $aNode.addEventListener('click', this.displayResult)

    this.aNode = $aNode
  }

  Clip.prototype.generateLi = function() {
    // LI CONTAINER
    var $liNode = document.createElement('li')
    if (this.pinned) $liNode.classList.add('pinned')

    // DESCRIPTION
    var $description = document.createElement('div')
    $description.classList.add('description')
    $description.innerHTML = this.getElapsedTime() + ' &bull; ' +
      '<button class="switcher" onclick="nextMode()">' +
        '<span data-mode="chars">' + this.stats.chars + ' chars</span>' +
        '<span data-mode="bytes">' + this.stats.bytes + ' bytes</span>' +
        '<span data-mode="words">' + this.stats.words + ' words</span>' +
        '<span data-mode="lines">' + this.stats.lines + ' lines</span>' +
      '</button>' + ' &bull; ' + this.language

    // TITLE
    var $title = document.createElement('h2')
    $title.innerText = this.title

    // SAMPLE TEXT
    var $sample = document.createElement('pre')
    $sample.innerText = this.displayText

    // CONTROLS
    var $controls = document.createElement('div')
    $controls.classList.add('controls')
    var $pinButton = document.createElement('button')
    $pinButton.addEventListener('click', this.togglePinned)
    $pinButton.setAttribute('data-icon', 'pin')
    var $copyButton = document.createElement('button')
    $copyButton.addEventListener('click', this.copyToClipboard)
    $copyButton.setAttribute('data-icon', 'copy')
    var $deleteButton = document.createElement('button')
    $deleteButton.addEventListener('click', this.deleteNode)
    $deleteButton.setAttribute('data-icon', 'delete')

    $controls.appendChild($pinButton)
    $controls.appendChild($copyButton)
    $controls.appendChild($deleteButton)

    $liNode.appendChild($description)
    $liNode.appendChild($title)
    $liNode.appendChild($sample)
    $liNode.appendChild($controls)

    this.liNode = $liNode
  }
  Clip.prototype.regenerateListItem = function() {
    this.liNode.remove()
    this.generateLi()
    this.aNode.appendChild(this.liNode)
  }

  Clip.prototype.displayResult = function() {

  }

  root.Clip = Clip
}(window))