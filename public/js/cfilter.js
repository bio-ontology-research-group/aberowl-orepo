$(function() {
  var terms = {};

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
      var newTags = [];
      $.getJSON('/service/api/runQuery.groovy', {
        'query': encodeURIComponent(tag),
        'type': 'subeq',
        'labels': true,
        'ontology': 'EDAMTO'
      }, function(data) {
        newTags.push(tag);
        if(data && data.result.length > 0) {
          $.each(data.result, function(t, y) {
           newTags.push(y.label[0]);
          });

          terms[tag] = newTags;

          $('#otable tr').each(function(row) {
            var relevant = false;
            var cell = $('td:first', this).html();
            $.each(terms, function(a, y) {
              for(var m=0;m<y.length;m++) {
                if(cell.match('\>' + y[m] +'\<\/span\>')) relevant = true; // yeah that's bad 
              }
            });

            if(!relevant) {
              $(this).hide();
            }
          });

        }
      });

            
    },
    'onRemoveTag': function(tag) {
      delete terms[tag];

      var matched = false;
      $('#otable tr').each(function(row) {
        var cell = $('td:first', this).text();

        if(terms.length > 0) {
          $.each(terms, function(t) {
            for(var m=0;m<t.length;m++) {
              if(cell.match(t[m])) matched = true;
            }
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
    }
  });
});
