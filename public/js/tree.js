$(function() {
  var ontology = $('#ontology_value').text();
  $('#tree')
  .on('changed.jstree', function (e, data) {
    var i, j, r = [];
    for(i = 0, j = data.selected.length; i < j; i++) {
      r.push(data.instance.get_node(data.selected[i]).text);
    }
    var last = data.selected[data.selected.length-1];
console.log('sending /api/getClass.groovy?type=equivalent&query='+last+'&ontology='+ontology);
    $.getJSON('/api/getClass.groovy?type=equivalent&query='+encodeURIComponent(last)+'&ontology='+ontology,function(data) {
      console.log(data);
      var html = '<table class="table table-striped"><tbody>'
      $.each(data, function(a, y) {
        html += '<tr><td>'+a+'</td><td>'+y+'</td></tr>'
      });
      html += '</tbody></table>';
      $('#browse_content').html(html);
      $('#tabs').tabs('option', 'active', 1);
    });
  }) 
  .jstree({
    'plugins': ['ui', 'json_data', 'themes'],
    'core' : {
      'data' : {
        'url' : function (node) {
          return node.id === '#' ? 
            '/api/runQuery.groovy?type=subclass&direct=true&query=<http://www.w3.org/2002/07/owl%23Thing>&ontology='+ontology : 
            '/api/runQuery.groovy?type=subclass&direct=true&query=<'+encodeURIComponent(node.id)+'>&ontology='+ontology;
        },
        'dataFilter': function(data) {
          console.log('got data filter');
          data = JSON.parse(data).result;
          var nodes = [];

          $.each(data, function(i, c) {
            var node = {
              'id': c.classURI,
              'text': c.label,
              'children': true
            };
            if(!node.text) node.text = c.remainder;
            nodes.push(node);
          });

          return nodes;
        },
        'dataType': 'text'
      }
    }
  });
});
