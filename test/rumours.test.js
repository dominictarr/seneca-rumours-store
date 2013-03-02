/* Copyright (c) 2010-2013 Richard Rodger */

"use strict";

var rimraf = require('rimraf')

var seneca = require('seneca')

var shared = seneca.test.store.shared


rimraf.sync('/tmp/seneca-rumours-store-test')

var si = seneca()
si.use(require('../'), {
  root: '/tmp/seneca-rumours-store-test'
})

si.__testcount = 0
var testcount = 0

describe('mem', function(){
  it('basic', function(done){
    testcount++
    shared.basictest(si,done)
  })

  it('close', function(done){
    shared.closetest(si,testcount,done)
  })
})

