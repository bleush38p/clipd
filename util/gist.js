var http = require('https')

function create(desc, publ, gists, callback) {
  try {
    var options = {
      method: "POST",
      hostname: "api.github.com",
      port: null,
      path: "/gists",
      headers: {
        "content-type": "application/json",
        "user-agent": "bleush38p-clipd"
      }
    }

    var req = http.request(options, function(res) {
      var chunks = []
      res.on('data', function(chunk) {
        chunks.push(chunk)
      })
      res.on('end', function() {
        var body = Buffer.concat(chunks)
        console.log('ended!')
        callback(body.toString())
      })
    })

    req.write(JSON.stringify({
      description: desc,
      public: publ,
      files: gists
    }))
    req.end()
  } catch (e) {
    console.error('things have gone horribly wrong', e)
  }
}

module.exports = {
  create: create
}