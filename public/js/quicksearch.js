$(function() {
$('#quicksearch').tagsInput({
    'height': '40px',
    'width': '100%',
    'defaultText': '',
    'delimiter': '|',
    'autocomplete_url': '',
    'autocomplete': {
      'source': function(request, response) {
        var ontology = $("#ontology").text(),
            query = extractLast(request.term);

        $.getJSON("/service/api/queryNames.groovy", {
            term: query,
            ontology: ontology
        }, function(json) {
          if(query.match(/an/)) {
            json.unshift({
              'data': 'AND',
              'iri': 'AND',
              'ontology': '',
              'value': 'AND'
            }); 
          } else if(query.match(/so/)) {
            json.unshift({
              'data': 'SOME',
              'iri': 'SOME',
              'ontology': '',
              'value': 'SOME'
            });
          }
          response(json);
        });
      },
      'select': function(event, ui) {
        window.location = '?c=' + encodeURIComponent(ui.item.data);
      }
    }, 
    'autocomplete_renderitem': function(ul, item) {
      var label = item.label || item.remainder || item.classURI;
      return $( "<li>" )
             .append( "<p>" + label +"</p> <p> <span style=\"float:left;font-size:9px\">" + item.iri + "</span>"+
              "<span style=\"font-size:9px;margin-left:20px;float:right;\"><b>"+item.ontology+"</b></span></p><br />")
             .appendTo(ul);
     },
     'onRemoveTag': function(value) {
        delete uriMap[value];
     },
     'onAddTag': function() {
       $('div.tagsinput span.tag').filter(function(){ return $(this).text().match(/^AND\s/) || $(this).text().match(/^SOME\s/); }).each(function(){ $(this).css('backgroundColor', '#123'); });
     }
  });
});

function split( val ) {
  return val.split( /\s/ );
}
function extractLast( term ) {
  return term.split('\'').pop();
}
