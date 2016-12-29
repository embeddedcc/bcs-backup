/*global BCS */
(function () {

var bcs = {};
var processList = $('<select>', {'data-name': 'processDest'});

function backupProcess(id, callback) {
  var process = {
    id: id,
    timer: [{}, {}, {}, {}],
    state: [{}, {}, {}, {}, {}, {}, {}, {}]
  };


  async.series([
      /*
        Get Process Data
      */
      function(done) {
        bcs.read('process/' + id).then(function (result) {
          process.process = result;
          done();
        });
      },
      /*
          States
      */
      function(done) {
        async.timesSeries(8, function(i, nextState) {
          async.series([
              function(next) {
                bcs.read('process/' + id + '/state/' + i).then(function (state) {
                  process['state'][i]['state'] = state;
                  next();
                })
                .fail(function() {
                  console.log("error fetching state");
                  next();
                });
              },
              function(next) {
                var apis = bcs.type === 'BCS-460' ?
                  ['exit_conditions', 'output_controllers'] :
                  ['exit_conditions', 'output_controllers', 'boolean_outputs'];

                async.eachSeries(apis, function(api, nextSub) {
                  bcs.read('process/' + id + '/state/' + i + '/' + api).then( function (result) {
                    process['state'][i][api] = result;
                    nextSub();
                  })
                  .fail(function() {
                    console.log("error: api - " + api);
                    nextSub();
                  });
                }, next);
              }
            ],
            function() {
              nextState();
            });
        }, done);
      },
      /*
        Timers
      */
      function(done) {
        async.timesSeries(4, function(i, next) {
          bcs.read('process/' + id + '/timer/' + i).then(function (timer) {
            process['timer'][i] = timer;
            next();
          });
        }, done);
      }
    ],
    function() {
      callback(process);
    });
}

function backupSystem(callback) {
  var system = {};

  async.series([
      function(done) {
        async.eachSeries(['device', 'system', 'network'], function(api, next) {
          bcs.read(api).then( function (result) {
            if (api === 'network') {
              delete result.ip;
              delete result.mac;
            }
            system[api] = result;
            next();
          });
        }, done);
      },

      function(done) {
        system.temp = [];
        async.timesSeries(bcs.probeCount, function(i, next) {
          system.temp.push({});
          bcs.read('temp/' + i).then( function (result) {
            system.temp[i] = result;
            next();
          });
        }, done);
      },

      function(done) {
        system.din = [];
        async.timesSeries(bcs.inputCount, function(i, next) {
          system.din.push({});
          bcs.read('din/' + i).then(function (result) {
            system.din[i] = result;
            next();
          });
        }, done);
      },

      function(done) {
        system.output = [];
        async.timesSeries(bcs.outputCount, function(i, next) {
          system.output.push({});
          bcs.read('output/' + i).then(function (result) {
            system.output[i] = result;
            next();
          });
        }, done);
      },

      function(done) {
        system.pid = [];
        async.timesSeries(bcs.probeCount, function(i, next) {
          system.pid.push({});
          bcs.read('pid/' + i).then(function (result) {
            system.pid[i] = result;
            next();
          });
        }, done);
      },

      function(done) {
        system.igniter = [];
        async.timesSeries(3, function(i, next) {
          system.igniter.push({});
          bcs.read('igniter/' + i).then(function (result) {
            system.igniter[i] = result;
            next();
          });
        }, done);
      },

      function(done) {
        system.ladder = [];
        async.timesSeries(40, function(i, next) {
          system.ladder.push({});
          bcs.read('ladder/' + i).then(function (result) {
            system.ladder[i] = result;
            next();
          });
        }, done);
      }
    ],
    function() {
      callback(system);
    });
}

function filterProperties(obj, filter) {
  var copy = Object.create(Object.getPrototypeOf(obj));
  var propNames = Object.getOwnPropertyNames(obj);

  propNames.forEach(function(name) {
    if (filter(name, obj[name])) {
      var desc = Object.getOwnPropertyDescriptor(obj, name);
      Object.defineProperty(copy, name, desc);
    }
  });

  return copy;
}


function restoreSystem(system, callback) {

  async.series([
      function(done) {
        async.eachSeries(['device', 'system' /*, 'network'*/ ], function(api, next) {
          bcs.write(api, system[api]).then(function () {
            next();
          })
          .fail(function() {
            console.log("failure writing api: " + api);
            next();
          });
        }, done);
      },

      function(done) {
        async.timesSeries(bcs.probeCount, function(i, next) {
          var temp;
          // Don't crash if we're posting a 460 config to a 462!
          if (system.temp.length > i) {
            temp = filterProperties(system.temp[i], function(prop) {
              return ['temp', 'setpoint'].indexOf(prop) === -1;
            });

            bcs.write('temp/' + i, temp).then(function () {
              next();
            })
            .fail(function() {
              console.log("failure writing temp: " + i);
              next();
            });
          }
        }, done);
      },

      function(done) {
        async.timesSeries(bcs.inputCount, function(i, next) {
          var din;
          if (system.din.length > i) {
            din = filterProperties(system.din[i], function(prop) {
              return prop !== 'on';
            });
            bcs.write('din/' + i, din).then(function () {
              next();
            })
            .fail(function() {
              console.log("failure writing din: " + i);
              next();
            });
          }
        }, done);
      },

      function(done) {
        async.timesSeries(bcs.outputCount, function(i, next) {
          var out;
          if (system.output.length > i) {
            out = filterProperties(system.output[i], function(prop) {
              return prop !== 'on';
            });
            bcs.write('output/' + i, out).then(function () {
              next();
            })
            .fail(function() {
              console.log("failure writing output: " + i);
              next();
            });
          }
        }, done);
      },
      function(done) {
        async.timesSeries(bcs.probeCount, function(i, next) {
          if (system.pid.length > i) {

            bcs.write('pid/' + i, system.pid[i]).then(function () {
              next();
            })
            .fail(function() {
              console.log("failure writing PID: " + i);
              next();
            });
          }
        }, done);
      },
      function(done) {
        async.timesSeries(3, function(i, next) {
          bcs.write('igniter/' + i, system.igniter[i]).then(function () {
            next();
          })
          .fail(function() {
            console.log("failure writing igniter: " + i);
            next();
          });
        }, done);
      },
      function(done) {
        async.timesSeries(40, function(i, next) {
          bcs.write('ladder/' + i, system.ladder[i]).then(function () {
            next();
          })
          .fail(function() {
            console.log("failure writing ladder: " + i);
            next();
          });
        }, done);
      }
    ],
    function() {
      callback(system);
    });
}

function restoreProcess(id, process, callback) {
  async.series([
      /*
          Set Process Data
      */
      function(done) {
        var proc = filterProperties(process.process, function(prop) {
          return ['running', 'paused', 'states'].indexOf(prop) === -1;
        });
        bcs.write('process/' + id, proc).then(function () {
          done();
        })
        .fail(function() {
          console.log('failure writing process: ' + id);
          done();
        });
      },
      /*
          States
      */
      function(done) {
        async.timesSeries(8, function(i, nextState) {
            async.series([
                function(next) {
                  bcs.write('process/' + id + '/state/' + i, process.state[i].state).then(function () {
                    next();
                  })
                  .fail(function() {
                    console.log('failure writing state: ' + i);
                    next();
                  });
                },
                function(next) {
                  var apis = bcs.version === 'BCS-460' ?
                    ['exit_conditions', 'output_controllers'] :
                    ['exit_conditions', 'output_controllers', 'boolean_outputs'];

                  async.eachSeries(apis, function(api, nextSub) {
                    bcs.write('process/' + id + '/state/' + i + '/' + api, process.state[i][api]).then(function () {
                      nextSub();
                    })
                    .fail(function() {
                      console.log('failure writing api: ' + api);
                      nextSub();
                    });
                  },
                  function() {
                    next();
                  });
                }
              ],
              nextState);
          },
          done);
      },
      /*
        Timers
      */
      function(done) {
        var timer;
        async.times(4, function(i, next) {
          timer = filterProperties(process.timer[i], function(prop) {
            return ['on', 'value', 'enabled'].indexOf(prop) === -1;
          });
          bcs.write('process/' + id + '/timer/' + i, timer).then(function () {
            next();
          })
          .fail(function() {
            console.log('failure writing timer: ' + i);
            next();
          });
        }, done);
      }
    ],
    function() {
      callback();
    });
}


$( document ).ready( function () {
  var  restoreData;
  /*
      When a BCS url is entered, verify that it is running 4.0
  */
  $('[data-name=bcs]').on('change', function (event) {
    $('#bcs').parent().removeClass('has-success').removeClass('has-error');
    if($(event.target.parentElement).find('.credentials [data-name=password]')[0]) {
      bcs = new BCS.Device(event.target.value, {
        auth: {
          username: 'admin',
          password: $(event.target.parentElement).find('.credentials [data-name=password]')[0].value
        }});
    } else {
      bcs = new BCS.Device(event.target.value);
    }

    bcs.on('ready', function () {
      localStorage['bcs-backup.url'] = event.target.value;
      $('[data-name=bcs]').parent().addClass('has-success').removeClass('has-error');
      $('button#backup').removeClass('disabled');

      bcs.helpers.getProcesses().then(function (processes) {
        processes.forEach( function (process, i) {
          $('[data-name=process][data-id=' + i +']').parent()
            .contents()
            .filter(function(){ return this.nodeType === 3; })
            .first()
            .replaceWith(process.name);

            processList.append($('<option>', { value: i }).text(process.name));
        });

        $('#backup-options').removeClass('hide');
      });
    })
    .on('notReady', function (e) {
      $('[data-name=bcs]').parent().addClass('has-error').removeClass('has-success');
      $('#options').addClass('hide');
      $('button').addClass('disabled');
      // Check if authentication is required
      if(e.cors && e.cors === 'rejected') {
        $('.credentials').removeClass('hide');
      }
    });
  });

  $('[data-name=password]').on('change', function () {
    $('[data-name=bcs]').change();
  });
  /*
      Read the backup file to restore from disk
  */
  $('[data-name=backupFile]').on('change', function(event) {
    var file = event.target.files[0],
      reader;

    reader = new FileReader();

    reader.addEventListener("load", function(event) {
      restoreData = JSON.parse(event.target.result);
      if (restoreData.system && restoreData.system.device) {
        $("#restore-options").removeClass("hide");
        $('#version-warning').siblings().remove();

        if (restoreData.system.device.type === bcs.type) {
          $('#version-warning').addClass("hide");
          $('[data-name=backupFile]').parent().addClass('has-success').removeClass('has-error').removeClass('has-warning');
        } else if (restoreData.system.device.type.match(/^BCS\-46/)) {
          $('[data-name=backupFile]').parent().addClass('has-warning').removeClass('has-error').removeClass('has-success');
          $('#version-warning').removeClass("hide");
        } else {
          $('[data-name=backupFile]').parent().addClass('has-error').removeClass('has-warning').removeClass('has-success');
          $('#version-warning').addClass("hide");
          return;
        }

        if (restoreData.system.system) {
          $('<label>', {'class': 'checkbox'})
            .text('System Settings')
            .append($('<input>', {
              'type': 'checkbox',
              'data-name': 'system',
              'checked': 'checked'
            }))
            .appendTo($('#restore-options'));
        }


        $('<div>', {'class': 'restoreOption'})
          .append($('<span>').text('Backed Up Process'))
          .append($('<span>', {'class': 'pull-right'}).text('Process to Replace'))
          .appendTo($('#restore-options'));

        restoreData.processes.sort(function (a,b) { return a.id - b.id; });

        restoreData.processes.forEach(function(process, i) {
          $('<div>', {'class': 'restoreOption'})
            .append(
              $('<label>', {'class': 'checkbox'})
              .text(process.process.name)
              .append($('<input>', {
                'type': 'checkbox',
                'data-name': 'process',
                'data-id': i,
                'checked': 'checked'
              })))
            .append(processList.clone().attr('data-id', i).val(process.id))
            .appendTo($('#restore-options'));

        });

        $('button#restore').removeClass('disabled');
      }
    });

    reader.readAsText(file);
  });

  /*
      Restore the URL on page load if we saved one in localStorage
  */
  if(localStorage['bcs-backup.url'])
  {
    $('[data-name=bcs]').val(localStorage['bcs-backup.url']);
    $('[data-name=bcs]').change();
  }

  /*
      When the Restore button is pressed.
  */
  $('button#restore').on('click', function(event) {
    event.preventDefault();
    var dialog = $('#dialog .modal-body'),
      percent = (100 - 5) / ($("#restore-options [data-name=process]:checked").length + $("#restore-options [data-name=system]:checked").length),
      successBar;

    dialog.empty();
    dialog.append($('#progress').html());

    $('#dialog h4.modal-title').text("Restoring...");
    $('#dialog').modal('show');

    successBar = dialog.find('.progress-bar-success')[0];
    $(successBar).attr('aria-valuenow', 5);
    $(successBar).css('width', $(successBar).attr('aria-valuenow') + '%');

    async.series([
        function(done) {
          if ($("#restore-options [data-name=system]:checked").length > 0) {
            restoreSystem(restoreData.system, function() {
              $(successBar).attr('aria-valuenow', parseFloat($(successBar).attr('aria-valuenow')) + percent);
              $(successBar).css('width', $(successBar).attr('aria-valuenow') + '%');
              done();
            });
          } else {
            done();
          }
        },
        function(done) {
          async.each($("#restore-options [data-name=process]:checked"), function(p, next) {
              restoreProcess($("[data-name=processDest][data-id=" + p.dataset.id + "]").val(), restoreData.processes[p.dataset.id], function() {
                $(successBar).attr('aria-valuenow', parseFloat($(successBar).attr('aria-valuenow')) + percent);
                $(successBar).css('width', $(successBar).attr('aria-valuenow') + '%');
                next();
              });
            },
            done);
        }
      ],
      function() {
        $('#dialog').modal('hide');
      });

  });


  /*
      When the backup button is pressed...
  */
  $('button#backup').on('click', function(event) {
    event.preventDefault();
    var results = {
        processes: [],
        system: {}
      },
      percent = (100 - 5) / ($("#backup-options [data-name=process]:checked").length + 1),
      dialog = $('#dialog .modal-body'),
      successBar; //,

    dialog.empty();
    dialog.append($('#progress').html());

    $('#dialog h4.modal-title').text("Backing Up...");

    $('#dialog').modal('show');

    successBar = dialog.find('.progress-bar-success')[0];
    $(successBar).attr('aria-valuenow', 5);
    $(successBar).css('width', $(successBar).attr('aria-valuenow') + '%');

    async.series([
        /*
          Processes
        */
        function(done) {
          async.each($("#backup-options [data-name=process]:checked"), function(p, next) {
              backupProcess(p.dataset.id, function(process) {
                results.processes.push(process);
                $(successBar).attr('aria-valuenow', parseFloat($(successBar).attr('aria-valuenow')) + percent);
                $(successBar).css('width', $(successBar).attr('aria-valuenow') + '%');
                next();
              });
            },
            done);
        },
        /*
          System Settings
        */
        function(done) {
          if ($("#backup-options [data-name=system]:checked").length > 0) {
            backupSystem(function(system) {
              results.system = system;
              $(successBar).attr('aria-valuenow', parseFloat($(successBar).attr('aria-valuenow')) + percent);
              $(successBar).css('width', $(successBar).attr('aria-valuenow') + '%');
              done();
            });
          } else {
            // Always at least save device settings so we can tell what kind of device
            // generated the backup file.
            bcs.read('device').then(function (device) {
              results.system.device = device;
              $(successBar).attr('aria-valuenow', parseFloat($(successBar).attr('aria-valuenow')) + percent);
              $(successBar).css('width', $(successBar).attr('aria-valuenow') + '%');
              done();
            });
          }
        }
      ],
      function() {
        // Create and save the file
        var blob = new Blob([JSON.stringify(results)], {
          type: "text/plain;charset=utf-8"
        });
        saveAs(blob, ($('[data-name=fileName]').val() || "bcs-backup") + ".json");
        $('#dialog').modal('hide');
      });
  });
});

})();
