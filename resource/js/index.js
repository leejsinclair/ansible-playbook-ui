$('.dd').nestable();
$('.dd-handle a').on('mousedown', function(e){
    e.stopPropagation();
});

var $editor = $('#editor');

$('.main-tab').on('click', function(e) {
    var filename = $(this).data('name');
    $.get('/getfile/' + filename, function(data) {
        // setText(data);
        var doc = parseYML(data);
        var tags = extractTags(doc);
        addTagCheckboxes( tags );
        console.log( tags );
    });
    setFilename(filename);
});

$('#btn-check').on('click', function(e){
    var filename = $('#ymlname').html();
    var tag = $('input[name=tagSelection]:checked').val();
    addtab(filename);
    running = filename;
    localStorage.setItem(recomma(filename), '');

    var url = '/checkfile/' + filename + ( tag?'?tag='+tag:'' );
    $.get(url, function() {
        //location.href = '/';
    });
});

$('#btn-execute').on('click', function(e){
    var filename = $('#ymlname').html();
    var tag = $('input[name=tagSelection]:checked').val();
    addtab(filename);

    var proceed = confirm("Proceed with EXECUTE?");
    if( proceed ) {
        running = filename;
        localStorage.setItem(recomma(filename), '');

        var url = '/runfile/' + filename + ( tag?'?tag='+tag:'' );
        $.get(url, function() {
            //location.href = '/';
        });
    }
});

$('#btn-delete').on('click', function(e){
    var filename = $('#ymlname').html();

    var proceed = confirm("Proceed with DELETE?");
    if( proceed ) {
        $.get('/delfile/' + filename, function() {
            location.href = '/';
        });
    }
});

function addTagCheckboxes( tags ) {
    $editor.find('#tags').html('');
    for (i = 0; i < tags.length; i++) {
        var radioBtn = $('<li class="list-group-item radio"><label><input type="radio" name="tagSelection" value="'+tags[i]+'" />'+tags[i]+'</label></li>');
        radioBtn.appendTo('#tags');
    }
}

function setFilename(text) {
    var base = text || '';
    $editor.find('#ymlname').html(base).attr('data-name',base);
}

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
var running = '';
var sse = new EventSource('/stream');

sse.addEventListener('message', function(e) {
    // console.log(e.data);
    var refilename = recomma(running);
    $('#li' + refilename).click();
    var content = localStorage.getItem(refilename) + e.data + '\n';
    localStorage.setItem(refilename, content);

    var hasIssue = getIssue(e.data);

    $('#content' + refilename).html(content);
}, false);

function getIssue( str ) {
    var finalLineContains = [ ':', 'RECAP' ];
    var line = _.unique(str.split(' '));
    var isFinalLine = _.intersection( line, finalLineContains ).length===finalLineContains.length;

    if( isFinalLine ) {
        if( str.indexOf('failed=0') <0 || str.indexOf('unreachable=0')<0 ) {
            console.error('ERROR');
            beep();
        }
    }
}

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

function recomma(text) {
    return text.replace('.', '_')
}

var $filehead = $('#filehead');
var $filecontent = $('#filecontent');
function addtab(filename) {
    var refilename = recomma(filename);
    if ($('#li' + refilename)[0]) {
        return;
    }

    var head = $('<li id="li'+refilename+'">')
        .append($('<a data-toggle="tab" href="#content' + refilename+'">')
        .append('<i class="pink ace-icon fa fa-tachometer bigger-110"></i>' + filename))
    $filehead.append(head);

    var content = $('<div id="content'+refilename+'" class="tab-pane">');
    $filecontent.append(content);
}

$filecontent.children().each(function(i,e) {
    var e = $(e);
    var key = e.data('rename');
    e.html(localStorage.getItem(key));
});
$filehead.children(':first').children().click();