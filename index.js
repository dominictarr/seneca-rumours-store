"use strict";

var _       = require('underscore')
var uuid    = require('node-uuid')
var mapStream = require('map-stream')

var Rumours = require('rumours')

module.exports = function(opts, cb) {
  var desc

  var rumours = Rumours(opts)

  var entmap = {}

  var store = {

    name: 'rumours-store',

    save: function(args, cb){
      var si = this
      var ent = args.ent

      var create = !ent.id

      var canon = ent.canon$({object:true})
      var zone   = canon.zone
      var base   = canon.base
      var name   = canon.name
  
      if( create ) {
        this.act({role:'util',
          cmd:'generate_id',
          name:name,
          base:base,
          zone:zone
        }, function(err, id){
          if( err ) return cb(err);
          do_save(id)
        })
      }
      else do_save();

      function do_save(id) {
        if( id ) {
          ent.id = id
        }

        si.log.debug(function(){
          return [
            'save/'+(create?'insert':'update'),
            ent.canon$({string:1}),
            ent, desc
          ]
        })

        rumours.create(base, ['r-value', name, ent.id].join('!'), ent, function (err, obj) {
          //weird thing here, I return the object,
          //but it's not the same reference...
          cb(err, obj)
        })
  
      }
    },


    load: function(args,cb){
      var qent = args.qent
      var q    = args.q
      var ent  = args.ent
      var canon = ent.canon$({object:true})
      var zone   = canon.zone
      var base   = canon.base
      var name   = canon.name

      rumours.read(base, ['r-value', name, ent.id].join('!'), 
        function (err, obj) {
          cb(err, ent)
        })
    },


    list: function(args,cb){
      var qent = args.qent
      var q    = args.q
      var ent  = args.ent

      var canon = ent.canon$({object:true})
      var zone   = canon.zone
      var base   = canon.base
      var name   = canon.name

      var list = []
      var q = args.q

      setTimeout(function () {
        rumours.list(base, 'value')
          .on('data', function (ent) {
            if(!ent) return
            if(!q.all$)
              for(var p in q) {
                if( !~p.indexOf('$') && q[p] != ent[p] )
                  return
              }
            
            list.push(ent)
          })
          .on('end', function () {
            cb(null, list)
          })
      }, 500)
    },


    remove: function(args,cb){
      var seneca = this

      var qent = args.qent
      var q    = args.q

      var list = []

      var all  = q.all$ // default false
      var load  = _.isUndefined(q.load$) ? true : q.load$ // default true 

      var ent    = args.ent
      var canon  = ent.canon$({object:true})
      var zone   = canon.zone
      var base   = canon.base
      var name   = canon.name

      setTimeout(function () {
        rumours.list(base, 'value')
          .pipe(mapStream(function (ent, next) {
            if(!ent) return next()
            var id = ent._id || ent.id
            if(!ent) return next()
            if(!q.all$) {
              for(var p in q) {
                if( !~p.indexOf('$') && q[p] != ent[p] ) {
                  return next()
                }
              }
            }
            console.log('DELETE', base, id)
            rumours.delete(base, id, function (err, _) {
              console.log(err, _)
              rumours.read(base, id, function (err, obj) {
                console.log('DELETED?', obj)
                next()
              })
            })
          }))
          .on('data', function (ent) {
            list.push(ent)
          })
          .on('end', function () {
            setTimeout(function () {
              cb(null, [], list)
            }, 500)
          })
      }, 500)
    },


    close: function(args,cb){
      this.log.debug('close',desc)
      cb()
    },


    native: function(args,cb){
      cb(null, rumours)
    }
  }


  this.store.init(this, opts, store, function(err, tag, description){
    if( err ) return cb(err);

    desc = description

    opts.idlen = opts.idlen || 6

    this.add({role:store.name, cmd:'dump'}, function(args, cb){
      cb(null, entmap)
    })

    cb(null, {name:store.name, tag:tag})
  })
}

