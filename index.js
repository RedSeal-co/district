var debug  = require('debug')('district')
var findup = require('findup')
var mkdirp = require('mkdirp')
var once   = require('once')
var path   = require('path')
var fs     = require('fs')

module.exports = district

function district(namespace, linked, dirname, done) {
  linked  = Array.isArray(linked) ? linked : [linked]
  dirname = path.resolve(dirname)
  done    = once(done)

  findup(dirname, 'package.json', function(err, root) {
    if (err) return done(err)

    var node_modules = path.join(
      root = path.resolve(root || dirname)
    , 'node_modules', '@' + namespace)

    mkdirp(node_modules, function(err) {
      if (err) return done(err)
      doLink(node_modules)
    })
  })

  function doLink(node_modules) {
    var n = 0

    linked.forEach(function(dir) {
      var name = path.basename(dir)
      var dest = path.join(node_modules, name)
      var rel  = path.relative(node_modules, dir)


      fs.lstat(dest, function(err, stat) {
        if (err && err.code !== 'ENOENT') return done(err)
        if (err) return link()
        if (!stat.isSymbolicLink()) return done(new Error(
            'Module "'+name+'" cannot be linked into '+node_modules
          + ': something else already exists there'
        ))

        fs.unlink(dest, link)
      })

      function link(err) {
        if (err) return done(err)
        fs.symlink(rel, dest, 'junction', bump)
      }

      function bump(err) {
        if (err) return done(err)
        debug('Linked ' + name + ' into ./' + path.relative(process.cwd(), node_modules))
        if (++n === linked.length) return done()
      }
    })
  }
}