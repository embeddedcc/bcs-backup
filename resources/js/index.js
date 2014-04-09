(function () {

function backupProcess(bcs, id, callback) {
    var process = {
        id: id,
        win: [{}, {}, {}, {}],
        timer: [{}, {}, {}, {}],
        state: [{}, {}, {}, {}, {}, {}, {}, {}]
    };
    
    
    async.parallel([
        /*
            Get Process Data
        */
        function (done) {
            $.get(bcs.url + '/api/process/' + id ,function (data) {
                process.process = data;
                done();
            });
        },
        /*
            States
        */
        function (done) {
            async.times(8, function (i, nextState) {
                async.series([
                    function (next) {
                        $.get(bcs.url + '/api/process/' + id + '/state/' + i, function (data) {
                            process['state'][i]['state'] = data;
                            next();
                        })
                        .fail(function () {
                            console.log("error fetching state");
                            next();
                        });
                    },
                    function (next) {
                        var apis = bcs.version === 'BCS-460' ? 
                                ['exit_conditions', 'output_controllers'] :
                                ['exit_conditions', 'output_controllers', 'boolean_outputs'];
                                
                        async.each(apis, function (api, nextSub) {
                            $.get(bcs.url + '/api/process/' + id + '/state/' + i + '/' + api, function (data) {
                                process['state'][i][api] = data;
                                nextSub();
                            })
                            .fail(function () {
                                console.log("error: api - " + api);
                                nextSub();
                            });
                        }, next);
                    }
                ],
                function () {
                    nextState();
                });
            }, done);
        },
        /*
            Wins
        */
        function (done) {
            async.times(4, function (i, next) {
                $.get(bcs.url + '/api/process/' + id + '/win/' + i, function (data) {
                    delete data.value;
                    process['win'][i] = data;
                    next();
                });
            }, done);
        },
        /*
            Timers
        */
        function (done) {
            async.times(4, function (i, next) {
                $.get(bcs.url + '/api/process/' + id + '/timer/' + i, function (data) {
                    process['timer'][i] = data;
                    next();
                });
            }, done);
        }        
    ],
    function () {
        callback(process);
    });
}

function backupSystem(bcs, callback) {
    var system = {};

    async.parallel([
        function (done) {
            async.each(['device', 'system', 'network'], function (api, next) {
                $.get(bcs.url + '/api/' + api, function (data) {
                    if(api === 'network') {
                        delete data.ip;
                        delete data.mac;
                    }
                    system[api] = data;
                    next();
                });
            }, done);
        },
        
        function (done) {
            system.temp = [];
            async.times(bcs.probeCount, function (i, next) {
                system.temp.push({});
                $.get(bcs.url + '/api/temp/' + i, function (data) {
                    system.temp[i] = data;
                    next();
                });
            }, done);
        },
        
        function (done) {
            system.din = [];
            async.times(bcs.inputCount, function (i, next) {
                system.din.push({});
                $.get(bcs.url + '/api/din/' + i, function (data) {
                    system.din[i] = data;
                    next();
                });
            }, done);
        },
        
        function (done) {
            system.output = [];
            async.times(bcs.outputCount, function (i, next) {
                system.output.push({});
                $.get(bcs.url + '/api/output/' + i, function (data) {
                    system.output[i] = data;
                    next();
                });
            }, done);
        },
        
        function (done) {
            system.pid = [];
            async.times(bcs.probeCount, function (i, next) {
                system.pid.push({});
                $.get(bcs.url + '/api/pid/' + i, function (data) {
                    system.pid[i] = data;
                    next();
                });
            }, done);
        },
        
        function (done) {
            system.igniter = [];
            async.times(3, function (i, next) {
                system.igniter.push({});
                $.get(bcs.url + '/api/igniter/' + i, function (data) {
                    system.igniter[i] = data;
                    next();
                });
            }, done);
        },
        
        function (done) {
            system.ladder = [];
            async.times(40, function (i, next) {
                system.ladder.push({});
                $.get(bcs.url + '/api/ladder/' + i, function (data) {
                    system.ladder[i] = data;
                    next();
                });
            }, done);
        }
        ],
        function () {
            callback(system);
        });
}

function restoreSystem(bcs, system, callback) {

    async.parallel([
        function (done) {
            async.each(['device', 'system', 'network'], function (api, next) {
                $.post(bcs.url + '/api/' + api, JSON.stringify(system[api]), function () {
                    next();
                })
                .fail(function () {
                    console.log("failure");
                    next();
                });
            }, done);
        },
        
        function (done) {
            async.times(bcs.probeCount, function (i, next) {
                // Don't crash if we're posting a 460 config to a 462!
                if(system.temp.length > i) {
                    $.post(bcs.url + '/api/temp/' + i, JSON.stringify(system.temp[i]), function () {
                        next();
                    })
                    .fail(function () {
                        console.log("failure");
                        next();
                    });
                }
            }, done);
        },
        
        function (done) {
            async.times(bcs.inputCount, function (i, next) {
                if(system.din.length > i) {
                    $.post(bcs.url + '/api/din/' + i, JSON.stringify(system.din[i]), function () {
                        next();
                    })
                    .fail(function () {
                        console.log("failure");
                        next();
                    });
                }
            }, done);
        },
        
        function (done) {
            async.times(bcs.outputCount, function (i, next) {
                if(system.output.length > i) {
                    $.post(bcs.url + '/api/output/' + i, JSON.stringify(system.output[i]), function () {
                        next();
                    })
                    .fail(function () {
                        console.log("failure");
                        next();
                    });
                }
            }, done);
        },
        
        function (done) {
            async.times(bcs.probeCount, function (i, next) {
                if(system.pid.length > i) {
                    $.post(bcs.url + '/api/pid/' + i, JSON.stringify(system.pid[i]), function () {
                        next();
                    })
                    .fail(function () {
                        console.log("failure");
                        next();
                    });
                }
            }, done);
        },
        
        function (done) {
            async.times(3, function (i, next) {
                $.post(bcs.url + '/api/igniter/' + i, JSON.stringify(system.igniter[i]), function () {
                    next();
                })
                .fail(function () {
                    console.log("failure");
                    next();
                });
            }, done);
        },
        
        function (done) {
            async.times(40, function (i, next) {
                $.post(bcs.url + '/api/ladder/' + i, JSON.stringify(system.ladder[i]), function () {
                    next();
                })
                .fail(function () {
                    console.log("failure");
                    next();
                });
            }, done);
        }
        ],
        function () {
            callback(system);
        });
}

function restoreProcess(bcs, id, process, callback) {
    async.parallel([
        /*
            Set Process Data
        */
        function (done) {
            $.post(bcs.url + '/api/process/' + id , JSON.stringify(process.process), function () {
                done();
            })
            .fail(function() {
                console.log('failure');
                done();
            });
        },
        /*
            States
        */
        function (done) {
            async.times(8, function (i, nextState) {
                async.series([
                    function (next) {
                        $.post(bcs.url + '/api/process/' + id + '/state/' + i, JSON.stringify(process.state[i].state), function () {
                            next();
                        })
                        .fail(function() {
                            console.log('failure');
                            next();
                        });
                    },
                    function (next) {
                        var apis = bcs.version === 'BCS-460' ? 
                                ['exit_conditions', 'output_controllers'] :
                                ['exit_conditions', 'output_controllers', 'boolean_outputs'];

                        async.each(apis, function (api, nextSub) {
                            $.post(bcs.url + '/api/process/' + id + '/state/' + i + '/' + api, JSON.stringify(process.state[i][api]), function () {
                                nextSub();
                            })
                            .fail(function() {
                                console.log('failure');
                                nextSub();
                            });
                        },
                        function () {
                            next();
                        });
                    }
                ],
                nextState);
            },
            done);
        },
        /*
            Wins
        */
        function (done) {
            async.times(4, function (i, next) {
                $.post(bcs.url + '/api/process/' + id + '/win/' + i, JSON.stringify(process.win[i]), function () {
                    next();
                })
                .fail(function() {
                    console.log('failure');
                    next();
                });
            }, done);
        },
        /*
            Timers
        */
        function (done) {
            async.times(4, function (i, next) {
                $.post(bcs.url + '/api/process/' + id + '/timer/' + i, JSON.stringify(process.timer[i]), function () {
                    next();
                })
                .fail(function() {
                    console.log('failure');
                    next();
                });
            }, done);
        }        
    ],
    function () {
        callback();
    });
}

$( document ).ready( function () {
    var bcs = {
            version: null,
            url: null,
            get probeCount() { return this.version === 'BCS-460' ? 4 : 8; },
            get inputCount() { return this.version === 'BCS-460' ? 4 : 8; },
            get outputCount() { return this.version === 'BCS-460' ? 6 : 18; }
        },
        processes,
        restoreData;
    /*
        When a BCS url is entered, verify that it is running 4.0
    */
    $('[data-name=bcs]').on('change', function (event) {
        $.get(event.target.value + '/api/device', function (data) {
            if(data.version === '4.0.0') {
                bcs.version = data.type;
                bcs.url = event.target.value;
                
                localStorage['bcs-backup.url'] = bcs.url;
                $('[data-name=bcs]').parent().addClass('has-success').removeClass('has-error');
                $('button#backup').removeClass('disabled');
                
                processes = [];
                async.times(8, function (id, next) {
                    $.get(event.target.value + '/api/process/' + id, function (data) {
                        processes.push({id: id, name: data.name});
                        next();
                    });
                },
                function () {
                    processes.sort(function (a,b) { return a.id - b.id; });

                    if(event.target.dataset.tab === 'backup') {
                        processes.forEach( function (e) {
                            $('[data-name=process][data-id=' + e.id +']').parent()
                                .contents()
                                .filter(function(){ return this.nodeType === 3; })
                                .first()
                                .replaceWith(e.name);
                        });
                        $('#backup-options').removeClass('hide');
                    }
                });

            } else {
                $('[data-name=bcs]').parent().addClass('has-error').removeClass('has-success');            
                $('#options').addClass('hide');
                $('button').addClass('disabled');
            }
        })
        .fail(function () {
            $('[data-name=bcs]').parent().addClass('has-error').removeClass('has-success');
            $('#backup-options').addClass('hide');
        });
    });
    
    /*
        Read the backup file to restore from disk
    */
    $('[data-name=backupFile]').on('change', function (event) {
        var file = event.target.files[0],
            reader;

        reader = new FileReader();

        reader.addEventListener("load", function(event) {
            restoreData = JSON.parse(event.target.result);
            if(restoreData.system && restoreData.system.device) {
                $("#restore-options").removeClass("hide");
                
                if(restoreData.system.device.type === bcs.version) {
                    $('#version-warning').addClass("hide");
                    $('[data-name=backupFile]').parent().addClass('has-success').removeClass('has-error').removeClass('has-warning');
                } else if(restoreData.system.device.type.match(/^BCS\-46/)) {
                    $('[data-name=backupFile]').parent().addClass('has-warning').removeClass('has-error').removeClass('has-success');
                    $('#version-warning').removeClass("hide");
                } else {
                    $('[data-name=backupFile]').parent().addClass('has-error').removeClass('has-warning').removeClass('has-success');
                    $('#version-warning').addClass("hide");
                    return;
                }

                if(restoreData.system.system) {
                    $('<label>', {'class': 'checkbox'})
                        .text('System Settings')
                        .append($('<input>', {'type': 'checkbox', 'data-name': 'system', 'checked': 'checked'}))
                        .appendTo($('#restore-options'));
                }
                var processList = $('<select>', {'data-name': 'processDest'});
                processes.forEach(function (process) {
                    processList.append($('<option>', {value: process.id}).text(process.name));
                });
                
                $('<div>', {'class': 'restoreOption'})
                    .append($('<span>').text('Backed Up Process'))
                    .append($('<span>', {'class': 'pull-right'}).text('Process to Replace'))
                    .appendTo($('#restore-options'));

                restoreData.processes.forEach(function (process, i) {
                    $('<div>', {'class': 'restoreOption'})
                    .append($('<label>', {'class': 'checkbox'})
                            .text(process.process.name)
                            .append($('<input>', {'type': 'checkbox', 'data-name': 'process', 'data-id': i, 'checked': 'checked'})))
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
        $('[data-name=bcs][data-tab=backup]').change();
    }
    
    /*
        When the Restore button is pressed.
    */
    $('button#restore').on('click', function (event) {
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
            function (done) {
                if($("#restore-options [data-name=system]:checked").length > 0) {
                    restoreSystem(bcs, restoreData.system, function () {
                        $(successBar).attr('aria-valuenow', parseFloat($(successBar).attr('aria-valuenow')) + percent );
                        $(successBar).css('width', $(successBar).attr('aria-valuenow') + '%');
                        done();
                    });
                } else {
                    done();
                }
            },
            function (done) {
                async.each($("#restore-options [data-name=process]:checked"), function (p, next) {
                    restoreProcess(bcs, $("[data-name=processDest][data-id=" + p.dataset.id + "]").val(), restoreData.processes[p.dataset.id], function () {
                        $(successBar).attr('aria-valuenow', parseFloat($(successBar).attr('aria-valuenow')) + percent );
                        $(successBar).css('width', $(successBar).attr('aria-valuenow') + '%');
                        next();
                    });
                },
                done);
            }
        ],
        function () {
            $('#dialog').modal('hide');
        });
        
    });
    
    
    /*
        When the backup button is pressed...
    */
    $('button#backup').on('click', function (event) {
        event.preventDefault();
        var results = {
            processes: [],
            system: {}
            },
            percent = (100 - 5) / ($("#backup-options [data-name=process]:checked").length + 1),
            dialog = $('#dialog .modal-body'),
            successBar;//,
            //dangerBar = dialog.find('.progress-bar-danger')[0];
            
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
            function (done) {
                async.each($("#backup-options [data-name=process]:checked"), function (p, next) {
                    backupProcess(bcs, p.dataset.id, function (process) {
                        results.processes.push(process);
                        $(successBar).attr('aria-valuenow', parseFloat($(successBar).attr('aria-valuenow')) + percent );
                        $(successBar).css('width', $(successBar).attr('aria-valuenow') + '%');
                        next();
                    });
                },
                done);
            },
            /*
                System Settings
            */
            function (done) {
                if($("#backup-options [data-name=system]:checked").length > 0) {
                    backupSystem(bcs, function (system) {
                        results.system = system;
                        $(successBar).attr('aria-valuenow', parseFloat($(successBar).attr('aria-valuenow')) + percent );
                        $(successBar).css('width', $(successBar).attr('aria-valuenow') + '%');
                        done();
                    });
                } else {
                    // Always at least save device settings so we can tell what kind of device
                    // generated the backup file.
                    $.get(bcs.url + '/api/device', function (data) {
                        results.system.device = data;
                        $(successBar).attr('aria-valuenow', parseFloat($(successBar).attr('aria-valuenow')) + percent );
                        $(successBar).css('width', $(successBar).attr('aria-valuenow') + '%');
                        done();
                    });
                }
            }
            ],
            function () {
                // Create and save the file
                var blob = new Blob([JSON.stringify(results)], {type: "text/plain;charset=utf-8"});
                saveAs(blob, "bcs-backup.json");
                $('#dialog').modal('hide');
            });
    });
});

})();
