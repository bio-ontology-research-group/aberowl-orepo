$(function() {
  var tags = [];
  $('#filter').tagsInput({
    'width': 'auto',
    'defaultText': 'Search by topic',
    'autocomplete_url': '',
    'autocomplete': {
      'selectFirst': true,
      'width': '100px',
      'autoFill': true,
      'source': function(request, response) {
        $.getJSON("/service/api/queryNames.groovy", {
             'term': request.term,
             'ontology': 'EDAMTO',
             'prefix': true 
        }, function(json) {
          response(Object.keys(json));
        });
       },
    },
    'onAddTag': function(tag) {
      $('#otable tr').each(function(row) {
        var cell = $('td:first', this).text();
        if(!cell.match(tag)) $(this).hide();
      });
      tags.push(tag);
    },
    'onRemoveTag': function(tag) {
      tags.splice(tags.indexOf(tag), 1);

      var matched = false;
      $('#otable tr').each(function(row) {
        var cell = $('td:first', this).text();

        if(tags.length > 0) {
          $.each(tags, function(t) {
            if(cell.match(t)) matched = true;
          });

          if(matched) {
            $(this).show();
          } else {
            $(this).hide();
          }
        } else {
          $(this).show();
        }
      });
      console.log('rmtag');
    }
  });
});
