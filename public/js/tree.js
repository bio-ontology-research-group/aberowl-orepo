var qs = function () {
  // This function is anonymous, is executed immediately and 
  // the return value is assigned to QueryString!
  var query_string = {};
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
        // If first entry with this name
    if (typeof query_string[pair[0]] === "undefined") {
      query_string[pair[0]] = pair[1];
        // If second entry with this name
    } else if (typeof query_string[pair[0]] === "string") {
      var arr = [ query_string[pair[0]], pair[1] ];
      query_string[pair[0]] = arr;
        // If third or later entry with this name
    } else {
      query_string[pair[0]].push(pair[1]);
    }
  } 
    return query_string;
} ();

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
        'url' : function(node) {
          if(node.id === '#') {
            if(qs.c) {  
              return '/api/findRoot.groovy?direct=true&query=<'+qs.c+'>&ontology='+ontology
            } else {
              return '/api/runQuery.groovy?type=subclass&direct=true&query=<http://www.w3.org/2002/07/owl%23Thing>&ontology='+ontology
            }
          } else {
            return '/api/runQuery.groovy?type=subclass&direct=true&query=<'+encodeURIComponent(node.id)+'>&ontology='+ontology
          }
        },
        'dataFilter': function(data) {
          data = JSON.parse(data);
          var nodes = [];
          var currentNode = false;
          
          if(data.classes) {
            while(true) {
              if(!data) break;

              var p = {
                'id': data.classes[0].classURI,
                'text': data.classes[0].label,
                'children': [],
                'state': {
                  'opened': true
                }
              };
              if(!p.text) p.text = data.classes[0].remainder;
              if(!data.children) {
                p.state.selected = true;
                p.children = true;
              }

              if(!currentNode) {
                nodes.push(p);
              } else {
                currentNode.push(p);
              }
              currentNode = p.children;

              data = data.children;
            }
          } else {
            data = data.result;
            $.each(data, function(i, c) {
              var node = {
                'id': c.classURI,
                'text': c.label,
                'children': true
              };
              if(!node.text) node.text = c.remainder;
              nodes.push(node);
            });
          }

          return nodes;
        },
        'dataType': 'text'
      }
    }
  });
});
