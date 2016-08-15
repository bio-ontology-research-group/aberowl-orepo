$(function() {
	$( "#tabs" ).tabs();
    $( "#tabs" ).on( "tabsactivate", function( event, ui ) {
        $('#manchester_search').DataTable().draw();
        $('#ontology_search').DataTable().draw();
        $('#main_search').DataTable().draw();
		if(ui.newPanel.selector == '#pubmed') {
	    	$("#pubmed_button").click();
		} else if(ui.newPanel.selector == '#data') {
	    	$("#data_button").click();
		} else if(ui.newPanel.selector == '#query') {
	    	//$("#button").click();
		} else if(ui.newPanel.selector == '#sparql') {
	    	var tree = $.jstree.reference('#left_tree');
	    	var selectedNodes = tree.get_selected(true);
	    		if(selectedNodes.length > 0) {
					var name = selectedNodes[0].text;
				if(name.indexOf(' ') != -1) {
		    		name = '\'' + name + '\'';
				}
				$('#squery').val($('#squery').val().replace(/INSERT OWL HERE/, name));
	    	}
		} else if(ui.newPanel.selector == '#visualise'){
			if($('#loadstatus').text() == 'Classified') {
				renderGraph()
			}
		}
    });//tab
});

