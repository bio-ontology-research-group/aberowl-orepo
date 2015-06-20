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
}();

$(function() {
    var ontology = $('#ontology_value').text();
    $('#left_tree')
	.on('open_node.jstree close_node.jstree', function(e, data) {
	    var currentNode = data.node;
	    if(e.type == 'close_node') {
		var tree = $.jstree.reference('#left_tree');
		tree.refresh_node(currentNode);
	    }
	    if (qs.c) {
		tree.fireEvent("changed.jstree");
	    }
	})
	.on('loading.jstree', function () {
	    if (qs.c) {
		$.getJSON('/service/api/getClass.groovy?type=equivalent&query='+decodeURIComponent(qs.c)+'&ontology='+ontology,function(data) {
		    var html = '<table class="table table-striped"><tbody>'
		    $.each(data, function(a, y) {
			html += '<tr><td>'+a+'</td><td>'+y+'</td></tr>'
		    });
		    html += '</tbody></table>';
		    $('#tabs').tabs('option', 'active', 1);
		    $('#browse').html(html);
		});

	    }
	})
	.on('changed.jstree', function (e, data) {
	    var last = data.selected[data.selected.length-1];
	    if(data.node) {
		$.getJSON('/service/api/getClass.groovy?type=equivalent&query='+encodeURIComponent(data.node.data)+'&ontology='+ontology,function(data) {
		    var html = '<table class="table table-striped"><tbody>'
		    $.each(data, function(a, y) {
			html += '<tr><td>'+a+'</td><td>'+y+'</td></tr>'
		    });
		    html += '</tbody></table>';
		    $('#browse_content').html(html);
		    $('#tabs').tabs('option', 'active', 1);
		});
	    }
	}) 
	.jstree({
	    'plugins': ['ui', 'json_data', 'themes'],
	    'core' : {
		'data' : {
		    'url' : function(node) {
			if(node.id === '#') {
			    if(qs.c) {
				return '/service/api/findRoot.groovy?direct=true&query=<'+qs.c+'>&ontology='+ontology
			    } else {
				return '/service/api/runQuery.groovy?type=subclass&direct=true&query=<http://www.w3.org/2002/07/owl%23Thing>&ontology='+ontology
			    }
			} else {
			    return '/service/api/runQuery.groovy?type=subclass&direct=true&query=<'+encodeURIComponent(node.data)+'>&ontology='+ontology
			}
		    },
		    'dataFilter': function(data) {
			data = JSON.parse(data);
			var nodes = [];
			
			if(data.classes) { // TODO remove much duplication wow
			    var addChildren = function(node, subtree) {
				node.children = [];
				$.each(subtree.classes, function(i, c) {
				    var p = {
					'id': c.classURI + i,
					'data': c.classURI,
					'text': c.label,
					'children': [],
					'state': {
					    'opened': false
					}
				    };
				    if(!p.text) p.text = c.remainder;
				    if(!p.text) p.text = c.classURI;

				    if(!c.deprecated) {
					node.children.push(p);

					if(data.chosen.classURI == c.classURI) {
					    $('#quicksearch').addTag(p.text);
					    p.state.selected = true;
					}

					if(c.children) {
					    p.state.opened = true;
					    p = addChildren(p, c.children);
					}
				    } else {
					console.log('not adding because deprecated');
				    }
				});

				return node;
			    };

			    $.each(data.classes, function(i, c) {
				var p = {
				    'id': c.classURI + i,
				    'data': c.classURI,
				    'text': c.label,
				    'children': true,
				    'state': {
					'opened': false
				    }
				};
				if(!p.text) p.text = c.remainder;
				if(!p.text) p.text = c.classURI;

				if(!c.deprecated) {
				    if(c.children) {
					p.state.opened = true;
					p = addChildren(p, c.children);
				    }

				    nodes.push(p);
				} else {
				    console.log('not adding because deprecated');
				}
			    });
			} else {
			    data = data.result;
			    $.each(data, function(i, c) {
				var node = {
				    'id': c.classURI + i,
				    'data': c.classURI,
				    'text': c.label,
				    'children': true
				};
				if(!node.text) node.text = c.remainder;
				if(!node.text) node.text = c.classURI;

				if(!c.deprecated) {
				    nodes.push(node);
				}
			    });
			}

			return nodes;
		    },
		    'dataType': 'text'
		}
	    }
	});
});
