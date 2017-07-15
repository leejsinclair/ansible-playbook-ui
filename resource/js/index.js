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
    running = filename;
    localStorage.setItem(recomma(filename), '');

    var url = '/runfile/' + filename + ( tag?'?tag='+tag:'' );
    $.get(url, function() {
        //location.href = '/';
    });
});

$('#btn-delete').on('click', function(e){
    var filename = $('#ymlname').html();
    $.get('/delfile/' + filename, function() {
        location.href = '/';
    });
});

function addTagCheckboxes( tags ) {
    $editor.find('#tags').html('');
    for (i = 0; i < tags.length; i++) {
        var radioBtn = $('<li class="list-group-item"><div class="radio"><label><input type="radio" name="tagSelection" value="'+tags[i]+'" />'+tags[i]+'</label></div></li>');
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
    doc.forEach(function(d) {
        if( d.tasks ) {
            var tasks = d.tasks;
            tasks.forEach(function(t){
                tags = _.unique(tags.concat( (t.tags||[])));
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
    var content = localStorage.getItem(refilename) + '<p>'+e.data + '</p>';
    localStorage.setItem(refilename, content);

    $('#content' + refilename).html(content);
}, false);

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
})
$filehead.children(':first').children().click();