///
var app = angular.module('myApp', [
    'ngResource'
]);

app.config(['$interpolateProvider', function($interpolateProvider) {
    $interpolateProvider.startSymbol('<%');
    $interpolateProvider.endSymbol('%>');
}]);

app.controller('ansibleCtrl', [ '$scope', '$resource', function($scope, $resource) {
    var vm = $scope;

    vm.files = [];
    vm.selectedFile = null;

    var api = $resource( '/:action/:filename', {}, {});

    vm.selectFile = function( file ) {
        vm.files.forEach( function(file){
            file.active = false;
        });

        vm.selectedFile = file;
        vm.selectedFile.active = true;

        api.get({'action': 'getfile', 'filename': file.name },
            function _success( response ) {
                if( response && response.content ) {
                    vm.selectedFile.content = response.content;
                    vm.selectedFile.yml = parseYML(response.content);
                    vm.selectedFile.tags = extractTags(vm.selectedFile.yml);
                    console.log( vm.selectedFile );
                }
            },
            function _error( err ) {
                debugger;
            }
        );

        function parseYML(text) {
            var doc = jsyaml.load(text);
            return doc;
        }

        function extractTags( doc ) {
            // Extract tags
            var tags = [];
            if( !doc ) {
                return [];
            }
            doc.forEach(function(d) {
                if( d.tasks ) {
                    var tasks = d.tasks;
                    tasks.forEach(function(t){
                        tags = _.unique(tags.concat( (t.tags||[]))).sort();
                    });
                }
                
            });
            return tags;
        }
    };

    api.get({ 'action': 'files' },
        function _success( response ) {
            vm.files = _.filter(response.files, function(file){ return file.name.indexOf('yml')>=0; });
            vm.selectFile(vm.files[0]);
        },
        function _error( error ) {
            debugger;
        }
    );

    vm.runPlaybook = function( action, file, tag ) {
        var sse = new EventSource('/stream');
        file.lineItems = [];

        sse.addEventListener('message', function(e) {
            var hasIssue = checkLineItem(e.data, file.lineItems);
            console.log( 'message', e.data, file.lineItems );
            vm.$apply();
        }, false);

        // var url = '/checkfile/' + filename + ( tag?'?tag='+tag:'' );
        api.get( { 'action': action, 'filename': file.name, 'tag': tag},
            function _success( response ) {
                //
                console.log( 'resp', response );
            },
            function _error( err ) {
                //
            } 
        );

        /**
         * @func beep
         * @name beep
         * @memberof app.betia.arbControl
         * @description Play sound in browser. This function will play a sound as long as a sound has not been play in the last 500 ms
         */
        function beep() {
            var snd = new Audio("data:audio/wav;base64,/+MYxAAKsAaxmUAQAqqq5jfsQAgsEC4P6ji4Pg+oMFHSjgQ/yH4nef//KHP/w//nP/UGJQEHf6k2dEkT6bQ3Dc3nEyWLv+cR/+MYxBAQciqwAY1oAC8Z/5WNBR6gJr6wHN9S/f//x6DqvdmeI4df8Rwv//UaJpIqV+PL/48frT+v9f6v9f+pCw+LhwSEgGEf/+MYxAkPGpLoAYVQABRjw6Uxv838wlY895xqHBWkvOH728Ov+H/9H/V0f80eI/8PDP/j1v05f////8jd9Dv//Wpy27E04PuT/+MYxAcO02L2Oco4AzMb05pswtfoy/S/OcFTf/FcSjv///xULn///84eAPOO/+3/////9B4Cxv///////+PA+NxqJjgQjhtH/+MYxAYOsoq6WVBoANEmUWt9SWcNavf/9RRDjTH/oIgEYbh52sv//9ZLBxf///k8Lwi3/qKf/////9SYwRL///+igjjvX25l/+MYxAYNyhqYIYKYANP//zgk9ZgDXCyIaAW2m+gLUJ9Nv03/Nv4/j1+wfmWT/6xaTr/zUiTaH89/89/oO/VVFEDgLP+sRHsr/+MYxAkLUAZ2GcAQAP4sDXzsQgqCp3/WCv/1A0DP+z//1nf8JYiBoFQVBUFQkDQNB1VMQU1FMy45OS41VVVVVVVVVVVVVVVV/+MYxBYAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV");
            snd.play();
        }

        function checkLineItem( str, lineItems ) {
            var finalLineContains = [ 'ok', 'changed','failed','unreachable' ];
            var taskLineContains = [ 'TASK' ];
            var okLineContains = [ 'ok' ];
            var changedLineContains = [ 'changed' ];
            var fatalLineContains = [ 'fatal' ];
            var skippingLineContains = [ 'skipping' ];
            var line = _.unique(str.replace(/\W/g, ' ').split(' '));

            var isFinalLine = _.intersection( line, finalLineContains ).length===finalLineContains.length;
            var isTaskLine = _.intersection( line, taskLineContains ).length===taskLineContains.length;
            var isFatalLine = _.intersection( line, fatalLineContains ).length===fatalLineContains.length;
            var isSkipLine = _.intersection( line, skippingLineContains ).length===skippingLineContains.length;
            var isOKLine = _.intersection( line, okLineContains ).length===okLineContains.length;
            var isChangedLine = _.intersection( line, changedLineContains ).length===changedLineContains.length;

            if( isFinalLine ) {
                if( str.indexOf('failed=0') <0 || str.indexOf('unreachable=0')<0 ) {
                    console.error('ERROR');
                    beep();
                    lineItems.push({ 'type': 'summary', 'display_class': 'list-group-item-danger', 'content': str });
                    return true;
                } else {
                    lineItems.push({ 'type': 'summary', 'display_class': 'list-group-item-success',  'content': str });
                    return false;
                }
            }

            if( isTaskLine ) {
                lineItems.push({ 'type': 'task', 'display_class': 'list-group-item-info',  'content': str });
            }

            if( isOKLine || isChangedLine ) {
                lineItems.push({ 'type': 'line', 'display_class': 'list-group-item-info',  'content': str });
            }

            if( isFatalLine ) {
                lineItems.push({ 'type': 'fatal', 'display_class': 'list-group-item-danger',  'content': str });
            }

            if( isSkipLine ) {
                lineItems.push({ 'type': 'fatal', 'display_class': 'list-group-item-warning',  'content': str });
            }

            return false;
        }
    };
}]);