/* global allFiles */
/* global parentFolders */
var CHANGES = false
var rightClickElementId = null
var rightClickElementInfo = null
var playlistSize = 0
var playlistFiles = 0
var playlistTime = 0

/**
 * Class to load an image and replace the target by image when image has loaded
 */
var ImageLoader = function (url, gradient, target, callback) {
  if (typeof gradient !== 'undefined' && typeof target !== 'undefined') {
    target.css('background-image', 'linear-gradient(100deg, ' +
      gradient[0] + ', ' + gradient[1] + ')')
  }

  if (url === null) return

  var i = new Image()
  i.callback = callback
  i.target = target
  i.url = url
  i.onload = function () {
    if (typeof this.callback === 'function') {
      this.callback(this.target, this.url)
    }
  }

  i.src = url
}

// --------------------------------------------------------------------------------
// -----------------------------     REEL CLASS   ---------------------------------
// --------------------------------------------------------------------------------

/**
 * Class to deal with the Reel
 */
var Reel = function (dropElem, timeElem, tpreview) {
  this.sink = dropElem
  this.timeElem = timeElem
  this.tpreview = tpreview
  this.sinkOffset = dropElem.offset()

  this.defination = []
  this.elements = 0

  this.startX = 70
  this.startY = 0
  this.t = 0
  this.defaultWidth = 150
  this.defaultEWidth = 4

  // current last width offset
  this.x = this.startX

  this.widthNeeded = 72

  var _this = this

  $(this.sink)[0].ondragenter = Reel.prototype.DragEnterListener

  $(this.sink)[0].ondragleave = Reel.prototype.DragLeaveListener

  $(this.sink)[0].ondragover = function (e) {
    Reel.prototype.DragOverListener(e, _this)
  }

  $(this.sink)[0].ondrop = function (e) {
    Reel.prototype.DragDropListener(e, _this)
  }

  $(this.sink)[0].ondragleave = function (event) {
    event.preventDefault()
    event.stopPropagation()
  }
}

var reelObj

var customDrop = function (id) {
  CHANGES = true
  var self = reelObj
  if (typeof id === 'undefined') return

  self.elements++
  if (self.elements === 1) {
    self.sink.html('')
  }

  $('#btn_tn_save, #btn_tn_update').removeClass('disabled')

  self.sink.children('.smedia-dphldr').remove()

  var obj = cloneObject(Workspace.objects[id])
  if (!isNaN(obj.size)) {
    playlistFiles++
    $('#playlistFiles').html(`${parseFloat(playlistFiles)}`)
    if (obj.category === 'video') {
      playlistTime += obj.properties.playtime_seconds
    } else {
      playlistTime += obj.length
    }
    $('#playlistTime').html(`${parseFloat(playlistTime).toFixed(2)} Secs`)
    playlistSize += obj.size
    $('#playlistSize').html(`${parseFloat((playlistSize / (1024 * 1024)).toFixed(4))} MB`)
  } else if (!isNaN(obj.length)) {
    playlistFiles++
    $('#playlistFiles').html(`${parseFloat(playlistFiles)}`)
    if (obj.category === 'video') {
      playlistTime += obj.properties.playtime_seconds
    } else {
      playlistTime += obj.length
    }
    $('#playlistTime').html(`${parseFloat(playlistTime).toFixed(2)} Secs`)
  }
  if (obj.category === 'image') obj.properties.playtime_seconds = obj.length
  // var position = -1

  // Create the DOM object
  var div = Workspace.createSMedia(obj, false)
  $(div).css('margin', '2px 2px')

  // Creating the element and pushing to structure
  self.defination.push(obj)
  self.sink.append(div)
  if (self.defination.length === 1) {
    self.UpdatePreviewImage()
  }

  // Modifying the rulers and infos
  // Modify the width of sink or timeline thingy if need be

  self.x += $(div).width() + 4
  self.t += obj.length
  self.widthNeeded += $(div).width() + 4

  if (self.sink.width() < self.widthNeeded) {
    self.sink.css('width', (self.widthNeeded + 400) + 'px')
    self.timeElem.css('width', (self.widthNeeded + 400) + 'px')
  }

  self.insertRuler(self.x, self.t)
  self.reDrawRuler()

  self.sink.children('.smedia-dphldr').remove()

  $('#tsink .smedia').each(function (index, obj) {
    $(this).attr('position', index)
  })

  // Update preview information
  Reel.previewInfo(self.t, self._getSize())

  // add remove event listener to this one
  $(div).children('.option').eq(0).on('click', removeEventLister(self))

  $(div).children('.option').eq(1).children('a').children('div.resizeoption').children('div')
    .children('button.save-btn').on('click', function (e) {
      var position = $(this).parent('div').parent('div.resizeoption')
        .parent('a').parent('div').parent('div').attr('position')

      // console.log(`position = ${position}`);
      var value = $(this).parent('div').parent('div.resizeoption').children('span').children('input').val()
      if (isNaN(value) || (value > 3600 || value < 1)) {
        $(this).parent('div').parent('div.resizeoption').children('span').children('input').val('')
        alert('Kindly enter a number between 1 and 3600')
        return
      }
      self.defination[position].length = parseInt(value)
      self.defination[position].properties.playtime_seconds = parseInt(value)
      self.fullDraw()
      $(this).parent('div').parent('div.resizeoption').css('top', '50px')
      $(this).parent().parent().parent().parent().parent().children('.tpagetime').css('z-index', '10')
      e.stopPropagation()
    })
  $(div).children('.option').eq(2).children('a').children('div.pagetimeoption').children('div')
    .children('button.page-btn').on('click', function (e) {
      var position = $(this).parent('div').parent('div.pagetimeoption')
        .parent('a').parent('div').parent('div').attr('position')
      // console.log(`position = ${position}`);
      var value = $(this).parent('div').parent('div.pagetimeoption').children('span').children('input').val()
      if (isNaN(value) || (value > 3600 || value < 1)) {
        $(this).parent('div').parent('div.pagetimeoption').children('span').children('input').val('')
        alert('Kindly enter a number between 1 and 3600')
      }
      self.defination[position].properties.pageTime = parseInt(value)
      $(this).parent('div').parent('div.pagetimeoption').css('top', '70px')
      CHANGES = true
    })
}

// update the previe info
// @static method
Reel.previewInfo = function (length, size) {
  if (length !== 0) {
    $('#bp_play').removeClass('disabled')
  }

  size = (size / (1024 * 1024)).toFixed(2)

  // Update preview information
  $('.tinfo.totallength').html(length + 's')
  $('.tinfo.totalsize').html(size + 'MB')

  var ratio = 0.05
  $('.tinfo.totaldownloadtime').html((size * ratio).toFixed(2) + 'min')
}

// Clear the Reel
Reel.prototype.Clear = function () {
  // Clear everything
  $('#tsink .smedia').remove()
  $('#timeviewer .time').remove()
  $('#timeviewer .line_v').remove()

  this.t = 0
  this.x = this.startX
  this.widthNeeded = 72
}

// return function which will be delete event listener
// for delete buttons on smedia on Reel
var removeEventLister = function (self) {
  return function () {
    // poition to remove
    var position = parseInt($(this).parent().attr('position'))

    var tmp = []
    for (let i = 0; i < self.defination.length; i++) {
      if (i === position) {
        self.t -= self.defination[i].length
        if (!isNaN(self.defination[i].size)) {
          playlistFiles--
          $('#playlistFiles').html(`${parseFloat(playlistFiles)}`)
          if (self.defination[i].category === 'video') {
            playlistTime -= self.defination[i].properties.playtime_seconds
          } else {
            playlistTime -= self.defination[i].length
          }
          $('#playlistTime').html(`${parseFloat(playlistTime).toFixed(2)} Secs`)
          playlistSize -= self.defination[i].size
          $('#playlistSize').html(`${parseFloat((playlistSize / (1024 * 1024)).toFixed(4))} MB`)
        }
        continue
      }
      tmp.push(self.defination[i])
    }

    self.defination = tmp
    self.elements--

    if (self.elements >= 0) {
      CHANGES = true
      $('#btn_tn_save').removeClass('disabled')
    }

    self.x -= (self.defaultWidth + 4)
    self.widthNeeded -= (self.defaultWidth + 4)

    // Update preview information
    Reel.previewInfo(self.t, self._getSize())

    if (self.sink.width() > self.widthNeeded + 400 && self.sink.width() > 2000) {
      self.sink.css('width', (self.widthNeeded + 400) + 'px')
      self.timeElem.css('width', (self.widthNeeded + 400) + 'px')
    }

    $(this).parent().remove()
    self.reDrawRuler()

    if (self.elements === 0) {
      self.sink.append('<p class="text-center row" style="border-right: 1px solid silver; padding-top: 40px; padding-left: 40px; justify-content: center; align-items: center;"><span class="fa fa-plus" style="padding-right: 5px;"></span> Right click media files to add here.</p>')
      CHANGES = false
      $('#btn_tn_save, #btn_tn_update').addClass('disabled')
    }

    self.UpdatePreviewImage()

    $('#tsink .smedia').each(function (index, obj) {
      $(this).attr('position', index)
    })
  }
}

// full draw the this.definition on Reel
Reel.prototype.fullDraw = function () {
  this.Clear()
  this.elements = 0

  playlistFiles = 0
  playlistTime = 0
  playlistSize = 0

  this.insertRuler(this.x, this.t)
  for (let i = 0; i < this.defination.length; i++) {
    if (!isNaN(this.defination[i].size)) {
      playlistFiles++
      $('#playlistFiles').html(`${parseFloat(playlistFiles)}`)
      if (this.defination[i].category === 'video') {
        playlistTime = parseFloat(playlistTime) + parseFloat(this.defination[i].properties.playtime_seconds)
      } else {
        playlistTime = parseFloat(playlistTime) + parseFloat(this.defination[i].length)
      }
      $('#playlistTime').html(`${parseFloat(playlistTime).toFixed(2)} Secs`)
      playlistSize += parseFloat(this.defination[i].size)
      $('#playlistSize').html(`${parseFloat((playlistSize / (1024 * 1024)).toFixed(4))} MB`)
    } else if (!isNaN(this.defination[i].length)) {
      playlistFiles++
      $('#playlistFiles').html(`${parseFloat(playlistFiles)}`)
      if (this.defination[i].category === 'video') {
        playlistTime = parseFloat(playlistTime) + parseFloat(this.defination[i].properties.playtime_seconds)
      } else {
        playlistTime = parseFloat(playlistTime) + parseFloat(this.defination[i].length)
      }
      $('#playlistTime').html(`${parseFloat(playlistTime).toFixed(2)} Secs`)
    }

    // Set the precision of the length value to 2
    // when update option is called.
    this.defination[i].length = parseFloat(
      parseFloat(this.defination[i].length).toFixed(2))

    // Create the DOM object
    var div = Workspace.createSMedia(this.defination[i], false)
    $(div).css('margin', '2px 2px')
    $(div).attr('position', i)
    this.sink.append(div)

    this.x += $(div).width() + 4
    this.t += parseFloat(this.defination[i].length)

    // in case sum go high on weed
    this.t = parseFloat(parseFloat(this.t).toFixed(2))

    this.widthNeeded += $(div).width() + 4

    if (this.sink.width() < this.widthNeeded + 400 && (this.widthNeeded + 400) > 1200) {
      this.sink.css('width', (this.widthNeeded + 400) + 'px')
      this.timeElem.css('width', (this.widthNeeded + 400) + 'px')
    }

    this.insertRuler(this.x, this.t)
    var self = this

    this.elements++
    $(div).children('.option').eq(0).on('click', removeEventLister(self))
    $(div).children('.option').eq(1).children('a').children('div.resizeoption').children('div')
      .children('button.save-btn').on('click', function (e) {
        var position = $(this).parent('div').parent('div.resizeoption')
          .parent('a').parent('div').parent('div').attr('position')

        // console.log(`position = ${position}`);
        var value = $(this).parent('div').parent('div.resizeoption').children('span').children('input').val()
        if (isNaN(value) || (value < 1)) {
          $(this).parent('div').parent('div.resizeoption').children('span').children('input').val('')
          alert('Kindly enter a number above 1')
        }
        self.defination[position].length = parseInt(value)
        self.defination[position].properties.playtime_seconds = parseInt(value)
        self.fullDraw()
        $(this).parent('div').parent('div.resizeoption').css('top', '50px')
        $(this).parent().parent().parent().parent().parent().children('.tpagetime').css('z-index', '10')

        CHANGES = true
        e.stopPropagation()
      })
    $(div).children('.option').eq(2).children('a').children('div.pagetimeoption').children('div')
      .children('button.page-btn').on('click', function (e) {
        var position = $(this).parent('div').parent('div.pagetimeoption')
          .parent('a').parent('div').parent('div').attr('position')
        // console.log(`position = ${position}`);
        var value = $(this).parent('div').parent('div.pagetimeoption').children('span').children('input').val()
        if (isNaN(value) || (value > 3600 || value < 1)) {
          $(this).parent('div').parent('div.pagetimeoption').children('span').children('input').val('')
          alert('Kindly enter a number between 1 and 3600')
        }
        self.defination[position].properties.pageTime = parseInt(value)
        $(this).parent('div').parent('div.pagetimeoption').css('top', '70px')
        CHANGES = true
        e.stopPropagation()
      })
  }

  // Update preview information
  Reel.previewInfo(self.t, self._getSize())
  this.UpdatePreviewImage()
  this.reDrawRuler()
}

Reel.prototype._getSize = function () {
  var size = 0
  var used = []
  for (let i = 0; i < this.defination.length; i++) {
    if (typeof used[this.defination[i].fileid] !== 'undefined') continue
    used[this.defination[i].fileid] = true
    size += this.defination[i].size
  }

  return size
}

// insert a ruler on screen
Reel.prototype.insertRuler = function (x, t) {
  this.timeElem.append('<div class="line_v" style="left: ' + x + 'px"></div>')
  this.timeElem.append('<div class="time" style="left: ' + x + 'px">' + t + '</div>')
}

// redraw the rulers and correct their positions
Reel.prototype.reDrawRuler = function () {
  let t = 0
  let w = 70
  for (let i = 0; i < this.defination.length; i++) {
    w += $('#tsink .smedia').eq(i).width() + 4
    t = parseFloat(t) + parseFloat(this.defination[i].length)

    // never let t go high
    t = parseFloat(parseFloat(t).toFixed(2))

    $('#timeviewer .time').eq(i + 1).css('left', w + 'px')
    $('#timeviewer .time').eq(i + 1).html(t)
    $('#timeviewer .line_v').eq(i + 1).css('left', w + 'px')
  }

  for (let j = this.defination.length + 1; j < $('#timeviewer .time').length; j++) {
    $('#timeviewer .time').eq(j).remove()
    $('#timeviewer .line_v').eq(j).remove()
  }
}

// get index according to drop point
Reel.prototype.getIndex = function (x) {
  x -= this.sink.offset().left
  var dx = x - this.startX
  var index = Math.floor(dx / (this.defaultWidth + this.defaultEWidth))
  index = (index < 0) ? 0 : index
  index = (index > this.defination.length) ? this.defination.length : index

  return index
}

// create the drop place holder
Reel.prototype.insertDropPlaceholder = function (e, x) {
  var index = this.getIndex(x)

  // Optimisation
  if (this.sink.children('.smedia-dphldr').length) {
    // find out its offset
    let offset = this.sink.children('.smedia-dphldr').offset().left - this.sinkOffset.left
    var offsetrelative = offset - this.startX
    var tindex = Math.floor(offsetrelative / (this.defaultWidth + this.defaultEWidth))
    if (tindex === index) {
      if (this.defination.length === index) {
        let offset = $('.smedia-dphldr').offset()
        if (x - offset.left + 20 > 150) { $('.smedia-dphldr').css('width', (x - offset.left + 20) + 'px') }
      }
      return
    }
  }

  this.sink.children('.smedia-dphldr').remove()

  if (this.sink.children('.smedia').length === 0) {
    this.sink.html('<div class="smedia-dphldr">DROP HERE</div>')
  }

  if (index === this.defination.length) {
    this.sink.children('.smedia').eq(this.defination.length - 1)
      .after('<div class="smedia-dphldr">DROP HERE</div>')

    var offset = $('.smedia-dphldr').offset()
    if (x - offset.left + 20 > 150) { $('.smedia-dphldr').css('width', (x - offset.left + 20) + 'px') }
  } else {
    this.sink.children('.smedia').eq(index)
      .before('<div class="smedia-dphldr">DROP HERE</div>')
  }

  e.preventDefault()
}

// Update the preview image on bottom
Reel.prototype.UpdatePreviewImage = function () {
  var obj = this.defination[0]
  if (typeof obj === 'undefined') return
  this.tpreview.html('')
  if (obj.thumb_url === null) {
    var gradient = Workspace.getGradient({
      category: 'audio'
    })
    this.tpreview.css('background-image', 'linear-gradient(100deg, ' +
      gradient[0] + ', ' + gradient[1] + ')')
    this.tpreview.html('<h2 style="margin-top: 180px; color: silver">' + obj.displayname + '</h2>')
  } else {
    this.tpreview.css('background-image', 'url(' + obj.thumb_url + ')')
  }
}

// Update the preview text info
Reel.prototype.UpdatePreviewInfo = function () {}

// event listener for drag
Reel.prototype.DragEnterListener = function (e) {
  // $(this).addClass('indrag');
  e.preventDefault()
}

// event listener to drag leave
Reel.prototype.DragLeaveListener = function (e) {
  // $(this).removeClass('indrag');
  // placeholder for now
}

// event listener to drag over
Reel.prototype.DragOverListener = function (e, self) {
  // $(this).addClass('indrag');
  self.insertDropPlaceholder(e, e.clientX)
  e.preventDefault()
}

var cloneObject = function (obj) {
  if (Object.prototype.toString.call(obj) === '[object Array]') {
    let clone = []
    for (var i = 0; i < obj.length; i++) {
      clone[i] = cloneObject(obj[i])
    }
    return clone
  } else if (typeof (obj) === 'object') {
    let clone = {}
    for (var prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        clone[prop] = cloneObject(obj[prop])
      }
    }
    if (clone.category !== 'audio' || clone.category !== 'video') {
      clone.length = 10
    }
    return clone
  } else {
    return obj
  }
}

// event listener for drop
Reel.prototype.DragDropListener = function (e, self) {
  CHANGES = true
  var id = e.dataTransfer.getData('text/plain')
  if (typeof id === 'undefined') return

  self.elements++
  if (self.elements === 1) {
    self.sink.html('')
  }

  $('#btn_tn_save, #btn_tn_update').removeClass('disabled')

  self.sink.children('.smedia-dphldr').remove()

  var dropX = e.clientX - self.sink.offset().left
  // var dropY = e.clientY - self.sink.offset().left
  var obj = cloneObject(Workspace.objects[id])
  if (!isNaN(obj.size)) {
    playlistFiles++
    $('#playlistFiles').html(`${parseFloat(playlistFiles)}`)
    if (obj.category === 'video') {
      playlistTime += obj.properties.playtime_seconds
    } else {
      playlistTime += obj.length
    }
    $('#playlistTime').html(`${parseFloat(playlistTime).toFixed(2)} Secs`)
    playlistSize += obj.size
    $('#playlistSize').html(`${parseFloat((playlistSize / (1024 * 1024)).toFixed(4))} MB`)
  } else if (!isNaN(obj.length)) {
    playlistFiles++
    $('#playlistFiles').html(`${parseFloat(playlistFiles)}`)
    if (obj.category === 'video') {
      playlistTime += obj.properties.playtime_seconds
    } else {
      playlistTime += obj.length
    }
    $('#playlistTime').html(`${parseFloat(playlistTime).toFixed(2)} Secs`)
  }
  if (obj.category === 'image') obj.properties.playtime_seconds = obj.length
  // var position = -1

  // Create the DOM object
  var div = Workspace.createSMedia(obj, false)
  $(div).css('margin', '2px 2px')

  // Creating the element and pushing to structure
  if (dropX <= self.startX) {
    self.defination.unshift(obj)
    self.sink.prepend(div)
    self.UpdatePreviewImage()
  } else if (dropX >= self.x) {
    // Things good to go
    self.defination.push(obj)
    self.sink.append(div)
    if (self.defination.length === 1) {
      self.UpdatePreviewImage()
    }
  } else {
    // in btw situation
    // make all animations for this
    var index = self.getIndex(e.clientX)
    var i
    for (i = self.defination.length; i > index; i--) {
      self.defination[i] = self.defination[i - 1]
    }
    self.defination[index] = obj

    if (index === 0) {
      self.sink.prepend(div)
      self.UpdatePreviewImage()
    } else self.sink.children('.smedia').eq(i).before(div)
  }

  // Modifying the rulers and infos
  // Modify the width of sink or timeline thingy if need be

  self.x += $(div).width() + 4
  self.t += obj.length
  self.widthNeeded += $(div).width() + 4

  if (self.sink.width() < self.widthNeeded) {
    self.sink.css('width', (self.widthNeeded + 400) + 'px')
    self.timeElem.css('width', (self.widthNeeded + 400) + 'px')
  }

  if (dropX <= self.startX) {
    // Kind of need to reset the scale
    self.insertRuler(self.x, self.t)
    self.reDrawRuler()
  } else if (dropX >= self.x) {
    // Things good to go
    self.insertRuler(self.x, self.t)
    self.reDrawRuler()
  } else {
    // need to reset scale
    self.insertRuler(self.x, self.t)
    self.reDrawRuler()
  }

  self.sink.children('.smedia-dphldr').remove()

  $('#tsink .smedia').each(function (index, obj) {
    $(this).attr('position', index)
  })

  // Update preview information
  Reel.previewInfo(self.t, self._getSize())

  // add remove event listener to this one
  $(div).children('.option').eq(0).on('click', removeEventLister(self))

  $(div).children('.option').eq(1).children('a').children('div.resizeoption').children('div')
    .children('button.save-btn').on('click', function (e) {
      var position = $(this).parent('div').parent('div.resizeoption')
        .parent('a').parent('div').parent('div').attr('position')

      // console.log(`position = ${position}`);
      var value = $(this).parent('div').parent('div.resizeoption').children('span').children('input').val()
      if (isNaN(value) || (value < 1)) {
        $(this).parent('div').parent('div.resizeoption').children('span').children('input').val('')
        alert('Kindly enter a number above 1')
        return
      }
      self.defination[position].length = parseInt(value)
      self.defination[position].properties.playtime_seconds = parseInt(value)
      self.fullDraw()
      $(this).parent('div').parent('div.resizeoption').css('top', '50px')
      $(this).parent().parent().parent().parent().parent().children('.tpagetime').css('z-index', '10')
      e.stopPropagation()
    })
  $(div).children('.option').eq(2).children('a').children('div.pagetimeoption').children('div')
    .children('button.page-btn').on('click', function (e) {
      var position = $(this).parent('div').parent('div.pagetimeoption')
        .parent('a').parent('div').parent('div').attr('position')
      // console.log(`position = ${position}`);
      var value = $(this).parent('div').parent('div.pagetimeoption').children('span').children('input').val()
      if (isNaN(value) || (value > 3600 || value < 1)) {
        $(this).parent('div').parent('div.pagetimeoption').children('span').children('input').val('')
        alert('Kindly enter a number between 1 and 3600')
      }
      self.defination[position].properties.pageTime = parseInt(value)
      $(this).parent('div').parent('div.pagetimeoption').css('top', '70px')
      CHANGES = true
      e.stopPropagation()
    })

  e.preventDefault()
  e.stopPropagation()
}

// --------------------------------------------------------------------------------
// -----------------------  REEL PREVIEW CLASS     --------------------------------
// --------------------------------------------------------------------------------
var Preview = function (div, reelDef) {
  this.target = div
  this.def = reelDef
  this.t = null
  this.ti = null
  this.i = 0
  this.rpos = $('.line_v_p').css('left')
  // console.log(this.rpos);
  this.bufferTimeleft = null

  this.preStartCallback = null
  this.postStopCallback = null
  this.prePauseCallback = null

  // preload the contents
  this.Preload()
}

Preview.prototype.Preload = function () {
  var fids = []
  for (i = 0; i < this.def.length; i++) {
    var o = this.def[i]
    if (typeof fids[o.fileid] !== 'undefined') continue // already loaded
    fids[o.fileid] = true

    switch (o.category) {
      case 'image':
        var i = new Image()
        i.src = o.url
        break
      case 'video':
        break
      case 'audio':
        var a = new Audio()
        a.src = o.url
        break
    }
  }
}

Preview.prototype.Play = function () {
  if (typeof this.preStartCallback === 'function') this.preStartCallback()

  var callback = function (self) {
    return function () {
      self.Play()
    }
  }

  if (this.i === this.def.length) {
    this.Stop()
    return
  }

  if (this.i === 0) {
    $('.line_v_p').css('border', '4px solid rgba(255, 0, 0, 0.64)')
  }

  var o = this.def[this.i]
  switch (o.category) {
    case 'image':
      this.target.html('')
      this.target.css('background-repeat', 'no-repeat')
      this.target.css('background-size', 'cover')
      this.target.css('background-image', 'url(' + o.url + ')')
      break
    case 'video':
      this.target.css('background-image', 'none')
      this.target.css('background', 'black')
      this.target.html('<video src="' + o.url + '" width="100%" autoplay muted></video>')
      break
    case 'audio':
      this.target.html('')
      this.target.css('background-repeat', 'no-repeat')
      this.target.css('background-size', 'cover')
      this.target.css('background-image', 'linear-gradient(180deg, grey, black)')
      // var a = new Audio();
      // a.src = o.url;
      break
  }

  var freq = o.length * 1000
  this.t = setTimeout(callback(this), freq)
  this.i++

  var _this = this

  var motion = function (i, t, l) {
    if (i === t) return
    var dx = 154 / (o.length * 10)
    l += dx
    $('.line_v_p').css('left', l + 'px')
    clearTimeout(_this.ti)
    _this.ti = setTimeout(function () {
      motion(i + 1, t, l)
    }, 100)
  }

  motion(0, o.length * 10, parseInt($('.line_v_p').css('left')))
}

Preview.prototype.Pause = function () {
  if (typeof this.prePauseCallback === 'function') this.prePauseCallback()
  clearTimeout(this.t)
  clearTimeout(this.ti)
}

Preview.prototype.Stop = function () {
  this.target.html('')
  this.i = 0
  clearTimeout(this.t)
  clearTimeout(this.ti)
  this.t = null
  this.ti = null
  this.bufferTimeleft = null

  this.target.css('background-repeat', 'no-repeat')
  this.target.css('background-size', 'cover')
  this.target.css('background-image', 'url(' + this.def[0].url + ')')
  $('.line_v_p').css('border', '1px dashed red')
  $('.line_v_p').css('left', this.rpos)

  if (typeof this.postStopCallback === 'function') this.postStopCallback()
}

// --------------------------------------------------------------------------------
// -----------------------  WORKSPACE OBJECT CLASS --------------------------------
// --------------------------------------------------------------------------------

// Class to deal with active Workspace {source}
// TODO: give backspace functionality to it
var Workspace = function (json, path) {
  this.target = $('.smedia_workspace')
  this.json = json
  this.path = path
  // this.Draw()
}

// Placeholder for all contants
Workspace.constants = {
  icons: {
    image: 'icon fa fa-image',
    video: 'icon fa fa-video',
    audio: 'icon fa fa-music'
  }
}

Workspace.objects = {}

Workspace.createSMedia = function (obj, draggable) {
  var div = document.createElement('div')
  $(div).addClass('smedia')
  if (!(typeof draggable !== 'undefined' && draggable === false)) { $(div).attr('draggable', true) }

  $(div).attr('data', obj.identifier)

  var _ddelete = document.createElement('div')
  $(_ddelete).addClass('option')
  $(_ddelete).addClass('tdelete')
  $(_ddelete).html('<a href="javascript: void(0)"><i class="fa fa-fw fa-close"></i></a>')
  $(div).append(_ddelete)

  if (obj.category === 'image' || obj.category === 'webview' || obj.category === 'widget' || obj.category === 'plugin' || obj.category === 'document' || obj.category === 'extras') {
    var _dtransition = document.createElement('div')
    $(_dtransition).addClass('option')
    $(_dtransition).addClass('trtransition')
    var objLength = 10 // Default  // obj.length;
    if (obj.length !== undefined && obj.length !== null && !isNaN(parseInt(obj.length))) {
      objLength = obj.length
    }
    var dropdowndiv = '<div class="resizeoption"><span>Show this for<input type="number" class="resizeblock" style="width: 60px;padding: 2px;" value="' + objLength + '"> sec</span>' +
      '<div style="margin-top: 5px"><button class="btn-success btn btn-sm btn-flat save-btn">save</button> <button class="btn-warning btn-sm btn btn-flat cancel-btn">cancel</button></div>' +
      '</div>'
    $(_dtransition).html('<a href="javascript: void(0)" style="position: relative"><i class="fa fa-arrows-h "></i>' + dropdowndiv + '</a>')

    $(div).append(_dtransition)

    $(_dtransition).on('click', function () {
      $(this).children('a').children('div.resizeoption').css('top', '-71px')
      $(this).parent().children('.tpagetime').css('z-index', '1')
    })

    $(_dtransition).children('a').children('div.resizeoption').children('div')
      .children('button.cancel-btn').on('click', function (e) {
        $(this).parent('div').parent('div.resizeoption').css('top', '50px')
        $(this).parent().parent().parent().parent().parent().children('.tpagetime').css('z-index', '10')
        e.stopPropagation()
      })
  }

  if (obj.category === 'document') {
    var _dpageTime = document.createElement('div')
    $(_dpageTime).addClass('option')
    $(_dpageTime).addClass('tpagetime')
    let objLength = 10 // Default page time
    let dropdowndiv = '<div class="pagetimeoption"><span>Each page time<input type="number" class="pagetimeblock" style="width: 60px;padding: 2px;" value="' + objLength + '"> sec</span>' +
      '<div style="margin-top: 5px"><button class="btn-success btn btn-sm btn-flat page-btn">save</button> <button class="btn-warning btn-sm btn btn-flat cancel-btn">cancel</button></div>' +
      '</div>'
    $(_dpageTime).html('<a href="javascript: void(0)" style="position: relative"><i class="fa fa-file"></i>' + dropdowndiv + '</a>')

    $(div).append(_dpageTime)

    $(_dpageTime).on('click', function () {
      $(this).children('a').children('div.pagetimeoption').css('top', '-31px')
    })

    $(_dpageTime).children('a').children('div.pagetimeoption').children('div')
      .children('button.cancel-btn').on('click', function (e) {
        $(this).parent('div').parent('div.pagetimeoption').css('top', '70px')
        e.stopPropagation()
      })
  }

  if (obj.category === 'video') {
    obj.length = obj.properties.playtime_seconds
  }

  // var gradient = this.getGradient(obj)
  ImageLoader(obj.thumb_url, this.getGradient(obj), $(div), function (tgt, url) {
    tgt.append('<div class="background"></div>')
    tgt.children('.background').css('background-image', 'url(' + url + ')')
  })

  // TODO: case to deal with undefined category
  // var category = obj.category
  // $(div).append('<span class="' + Workspace.constants.icons[category] + '"></span>')
  //
  // if (category === 'audio') {
  //   $(div).append('<span class="filename">' + obj.filename + '</span>')
  // }

  $(div).append(`<span class="icon fa fa-plus" onclick="customDrop('${obj.fid}')"></span>`)

  var fileInfo = ''
  if (obj.name !== undefined) {
    fileInfo = '<p>Filename: ' + obj.name + '</p>'
  } else if (obj.filename !== undefined) {
    fileInfo = '<p>Filename: ' + obj.filename + '</p>'
  }
  if (obj.size !== undefined) {
    fileInfo += '<p>Filesize: ' + parseFloat(obj.size / (1024 * 1024)).toFixed(4) + ' MB.</p>'
  }
  if (obj.url !== undefined) {
    fileInfo += '<p><a href=' + obj.url + ' target="_blank">View File <i class="fa fa-external-link"></i></a></p>'
  }

  // $(div).dblclick(function () {
  //   customDrop(obj.fid)
  // })

  $(div).bind('contextmenu', function (event) {
    rightClickElementId = obj.fid
    rightClickElementInfo = fileInfo
    event.preventDefault()
    $('.custom-menu').finish().toggle(100)
    .css({
      top: event.pageY + 'px',
      left: event.pageX + 'px'
    })
  })

  return div
}

function getRootFolders (id) {
  let folders = []
  folders.push(id)
  if (parentFolders[id] !== null) {
    folders.push(getRootFolders(parentFolders[id]))
  }
  return folders
}

Workspace.createElement = function (obj) {
  var div = document.createElement('div')
  $(div).addClass('smedia_container')
  $(div).attr('category', obj.category)
  if (obj.root_folder !== null) {
    let folders = getRootFolders(obj.root_folder)
    for (let i = 0; i < folders.length; i++) {
      $(div).addClass('folder_' + folders[i])
    }
  }
  $(div).html(this.createSMedia(obj))
  if (obj.extension === 'webview' || obj.extension === 'widget') {
    $(div).append('<div class="smedia_name">' + obj.displayname + '</div>')
  } else {
    $(div).append('<div class="smedia_name">' + obj.displayname + '.' + obj.extension + '</div>')
  }

  return div
}

Workspace.findIndex = function (child) {
  child.parent().parent().children().each(function (index, chlds) {
    if (chlds === child.parent()[0]) return index
  })
  return -1
}

Workspace.getGradient = function (obj) {
  if (obj.category === 'image' || obj.category === 'video') { return obj.gradient } else return ['#907878', 'rgba(86, 75, 75, 0.56)']
}

/**
 * Function to draw entities on Workspace
 */
Workspace.prototype.Draw = function () {
  this.target.html('')
  var i
  for (i = 0; i < this.json.length; i++) {
    var obj = this.json[i]
    if (obj.properties.playtime_seconds !== undefined && obj.properties.playtime_seconds !== null) {
      obj.length = parseFloat(parseFloat(obj.properties.playtime_seconds).toFixed(2))
    } else {
      obj.length = parseFloat(parseFloat(obj.length).toFixed(2))
    }

    var div = Workspace.createElement(obj)
    this.target.append(div)

    // Add an entry to Workspace objects about this element
    Workspace.objects[obj.identifier] = obj

    // Add event listener to drag and drop events for these elemets
    $(div).children('.smedia')[0].ondragstart = function (event) {
      event.dataTransfer.setData('text/plain', $(this).attr('data'))
      $(event.srcElement).parent('div').addClass('indrag')
      $(this).parent('div').click()
    }

    $(div).children('.smedia')[0].ondragend = function (e) {
      $(e.srcElement).parent('div').removeClass('indrag')
      $('.smedia-dphldr').remove()
    }

    $(div).on('click', function (e) {
      $('.smedia_container.selected').removeClass('selected')
      $(this).addClass('selected')
      var id = $(this).children('.smedia').attr('data')
      var obj = Workspace.objects[id]
      if (typeof obj === 'undefined') {
        // console.log('obj is undefined for id = ' +id);
      }
      if (obj.thumb_url != null) { $('.smdescription_img').html('<img src="' + obj.thumb_url + '">') } else {
        $('.smdescription_img').html('<div class="music_placeholder icon fa fa-music"></div>')
      }

      $('.smdescription').html('<div> </div>')
      $('.smdescription').append('<div><strong> Filename: </strong> ' + obj.displayname + '</div>')
      $('.smdescription').append('<div><strong> Category: </strong> ' + obj.category + '</div>')
      $('.smdescription').append('<div><strong> Length: </strong> ' + obj.length + 's</div>')

      // if (obj.category === 'video' || obj.category === 'audio')
      //  $(".smdescription").append('<div><button class="btn btn-default btn-sm">
      // <span class="fa fa-play"></span> preview </div>');

      e.stopPropagation()
    })
  }
}

// --------------------------------------------------------------------------------
// -------- DOCUMENT READY CLASS INSTANCE CREATION AND STUDD  ---------------------
// --------------------------------------------------------------------------------
$(document).ready(function () {
  // tmp load json from dom
  // var tmpJson = JSON.parse($("#tmp_json_file_data").html());
  // var wsObj = new Workspace(tmpJson, '/root/tmp');
  reelObj = new Reel($('#tsink'), $('#timeviewer'), $('#tpreviewscreen'))

  window.onbeforeunload = function () {
    if (CHANGES) return 'There are some unsaved changes! Are you sure you want to leave?'
  }

  $('#button_preview').on('click', function () {
    $('#preview_row').slideDown()
  })
  $('#preview_hide').on('click', function () {
    $('#preview_row').slideUp()
  })

  // Add event listener to save event
  $('#btn_tn_save').on('click', function () {
    var timelinename = $('#timeline_name').val().trim()
    var regexResult = /[a-zA-Z0-9_]*/.exec(timelinename)

    if (!timelinename.length) {
      toastr.error('Playlist name cannot be empty.')
      return
    }

    if (!CHANGES || typeof regexResult === undefined || typeof regexResult[0] === undefined || regexResult[0] !== timelinename) {
      toastr.error('Playlist name should be alpha-numeric or with a "_"')
      return
    }

    document.getElementById('tmln_overlay').style.width = '100%'

    let files = (reelObj.defination).map(file => {
      return file.id
    })

    let data = {
      timeline: reelObj.defination,
      name: timelinename,
      files: files.join(','),
      time: parseFloat(playlistTime).toFixed(2),
      size: parseFloat(playlistSize).toFixed(2)
    }

    let url = `//${window.location.host}/playlist`
    if ((window.location.href).indexOf('manage') > -1) {
      url = `//${window.location.host}/manage/playlist`
    }

    $.ajax({
      url: url,
      method: 'post',
      data,
      success: function (result) {
        document.getElementById('tmln_overlay').style.width = '0%'
        if (result.status) {
          CHANGES = false
          toastr.success(result.message)
          setTimeout(() => {
            location.href = url
          }, 1000)
        } else {
          toastr.error(result.message)
        }
      }
    })
  })

  // Add event listener to update event
  $('#btn_tn_update').on('click', function () {
    var timelineid = $('#_timeline_id').attr('dfid').trim()

    const push = confirm('Push updated playlist to devices?')

    document.getElementById('tmln_overlay').style.width = '100%'

    let files = (reelObj.defination).map(file => {
      return file.id
    })

    var data = {
      timeline: reelObj.defination,
      id: timelineid,
      push,
      files: files.join(','),
      time: parseFloat(playlistTime).toFixed(2),
      size: parseFloat(playlistSize).toFixed(2)
    }

    let url = `//${window.location.host}/playlist/update`
    let homeUrl = `//${window.location.host}/playlist`
    if ((window.location.href).indexOf('manage') > -1) {
      url = `//${window.location.host}/manage/playlist/update`
      homeUrl = `//${window.location.host}/manage/playlist`
    }

    $.ajax({
      url: url,
      method: 'post',
      data,
      success: function (result) {
        document.getElementById('tmln_overlay').style.width = '0%'
        if (result.status) {
          CHANGES = false
          toastr.success(result.message)
          setTimeout(() => {
            location.href = homeUrl
          }, 1000)
        } else {
          toastr.error(result.message)
        }
      }
    })
  })

  // Function to convert the object returned from server to required type
  function objConvertor (obj) {
    var i
    for (i = 0; i < obj.length; i++) {
      obj[i].identifier = obj[i].fid
      obj[i].thumb_url = obj[i].thumbnail_url
      obj[i].category = obj[i].type
      obj[i].gradient = ['#007CD6', '#032254']
      obj[i].fileid = obj[i].id
      obj[i].filename = obj[i].name
      obj[i].displayname = obj[i].displayname

      if (obj[i].filename.length > 17) {
        obj[i].filename = obj[i].filename.substr(0, 4) + '....' +
          obj[i].filename.substr(obj[i].filename.length - 4, obj[i].filename.length)
      }

      if (obj[i].displayname.length > 17) {
        obj[i].displayname = obj[i].displayname.substr(0, 4) + '....' +
          obj[i].displayname.substr(obj[i].displayname.length - 4, obj[i].displayname.length)
      }

      switch (obj[i].category) {
        case 'image':
          obj[i].length = 1
          break
        default:
          obj[i].length = 1
          break
      }

      if (typeof obj[i].properties.length !== 'undefined') { obj[i].length = obj[i].properties.length }

      if (typeof obj[i].properties.playtime_seconds !== 'undefined') { obj[i].length = obj[i].properties.playtime_seconds }

      obj[i].length = parseFloat(parseFloat(obj[i].length).toFixed(2))
    }
    return obj
  }

  // Function to load all files for this user
  function getFiles () {
    let ws = new Workspace(objConvertor(allFiles), 'mixed')
    ws.Draw()
  }

  getFiles()

  if ($('#json_loaded_timeline').length) {
    $('#tsink').html('')
    var json = JSON.parse($('#json_loaded_timeline').html())
    reelObj.defination = json
    reelObj.fullDraw()
  }

  // EVENT LISTENER TO PREVIEW OBJECTS
  var previewObj = new Preview($('#tpreviewscreen'), reelObj.defination)
  $('#bp_play').on('click', function () {
    previewObj.def = reelObj.defination
    previewObj.preStartCallback = function () {
      $('#bp_pause, #bp_stop').removeClass('disabled')
      $('#bp_play').addClass('disabled')
      $('#preview_DATA').html('Playing...')
    }

    previewObj.prePauseCallback = function () {
      $('#bp_pause, #bp_stop').addClass('disabled')
      $('#bp_play').removeClass('disabled')
      $('#preview_DATA').html('Paused...')
    }

    previewObj.postStopCallback = function () {
      $('#bp_pause, #bp_stop').addClass('disabled')
      $('#bp_play').removeClass('disabled')
      $('#preview_DATA').html('Preview')
    }

    previewObj.Play()
  })

  $('#bp_pause').on('click', function () {
    previewObj.Pause()
  })
  $('#bp_stop').on('click', function () {
    previewObj.Stop()
  })

  // If the document is clicked somewhere
  $(document).bind('mousedown', function (e) {
    // If the clicked element is not the menu
    if (!$(e.target).parents('.custom-menu').length > 0) {
      // Hide it
      $('.custom-menu').hide(100)
    }
  })

  $('.custom-menu li').click(function () {
    switch ($(this).attr('data-action')) {
      case 'first':
        $('#fileInfoBody').html(rightClickElementInfo)
        $('#fileInfo').modal('show')
        break
      case 'second':
        customDrop(rightClickElementId)
        break
    }
    $('.custom-menu').hide(100)
  })
})
