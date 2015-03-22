var query = "" ;

$(document).keypress(function(event){
 
	var keycode = (event.keyCode ? event.keyCode : event.which);
	if(keycode == '13'){
		$("#button").click();
//		alert('You pressed a "enter" key in somewhere');
	
	}
 
});

function redrawTable() {
    window.location.hash = "#" + query ;
    $('#example').dataTable().fnDestroy();
    var qType = $('input[name="type"]:checked').val();
    var ontology = $( "#ontologyselector option:selected" ).text();

    var table = $('#example').dataTable( {
        "processing": false,
        "serverSide": false,
	"paging": true,
	"scrollY": 400,
	"renderer": "bootstrap",
	"aaSorting": [[ 1, "asc" ]],
	"bAutoWidth": false,
	"iDisplayLength": 50,
	"bJQueryUI": true,
	aoColumns : [
	    { "sWidth": "15%"},
	    { "sWidth": "15%"},
	    { "sWidth": "30%"},
	    { "sWidth": "40%"},
	],
	"fnInitComplete": function( oSettings ) {
	    document.getElementById('pubmedsearchlink').href = "pubmed/?type="+qType+"&owlquery="+query+"&ontology="+ontology ;
	    $('#searchpubmed').show();                                                                                                         
	    document.getElementById('sparqlsearchlink').href = "sparql/?type="+qType+"&query="+query+"&ontology="+ontology ;
	    $('#searchsparql').show();                                                                                                         
        },
        "ajax": {
            "url": "api/runQuery.groovy?type="+qType+"&query="+query+"&ontology="+ontology,
	    "dataType": 'json',
            "dataSrc": function ( json ) {
                var datatable = new Array();
		$('#timer').text("Query took " + json.time + 'ms');
		result = json.result;

                for ( var i=0, ien=result.length ; i<ien ; i++ ) {
                    datatable[i] = new Array() ;
                    datatable[i][0] = "<a href='"+result[i].classURI+"'>"+result[i].classURI+"</a>" ;
                    datatable[i][1] = "<a href='"+result[i].ontologyURI+"'>"+result[i].ontologyURI+"</a>" ;
                    datatable[i][2] = result[i].label || " " ;
                    datatable[i][3] = result[i].definition || " " ;

                }
                return datatable;
            }
        },
	 "dom": 'T<"clear">lfrtip',
	"tableTools": {
            "sSwfPath": "js/TableTools-2.0.0/media/swf/copy_csv_xls_pdf.swf"
        }
    } );

//    $('#searchpubmed').show();
}

    function split( val ) {
      return val.split( /\s/ );
    }
    function extractLast( term ) {
      return split( term ).pop();
    }


$(document).ready(function() {
    $('#example').dataTable( {
        "processing": false,
        "serverSide": false,
	"paging": true,
	"scrollY": 400,
	aoColumns : [
	    { "sWidth": "15%"},
	    { "sWidth": "15%"},
	    { "sWidth": "30%"},
	    { "sWidth": "40%"},
	],
    })
      
    //$('#example').parents('div.dataTables_wrapper').first().hide();

	
    var q = window.location.hash.replace("#","");
    if (q!=null && q.length>0) {
            query = q ;
            redrawTable();
    //	document.getElementById('autocomplete').value = query ;
    }

            $( "#button" ).button();
	    //$( "#radioset" ).buttonset();

		$( "#autocomplete" )
		.bind( "keydown", function( event ) {
		    	if ( event.keyCode === $.ui.keyCode.TAB &&
            		$( this ).data( "ui-autocomplete" ).menu.active ) {
          		event.preventDefault();
        		}
      		})
		.autocomplete({
		    minLength: 3,
		    source: function( request, response ) {
			var ontology = $( "#ontologyselector option:selected" ).text();
			$.getJSON( "api/queryNames.groovy", {
			    term: extractLast( request.term ),
			    ontology : ontology,
			}, response );
		    },
		    search: function() {
			// custom minLength
			var term = extractLast( this.value );
			if ( term.length < 3 ) {
			    return false;
			}
		    },
		    focus: function() {
			// prevent value inserted on focus
			return false;
		    },
		    select: function( event, ui ) {
			var terms = split( this.value );
			// remove the current input
			terms.pop();
			// add the selected item
			terms.push( ui.item.value );
			// add placeholder to get the comma-and-space at the end
			terms.push( "" );
			this.value = terms.join( " " );
			return false;
		    }
		})
	.data( "ui-autocomplete" )._renderItem = function( ul, item ) {
	    return $( "<li>" )
		.append( "<a>" + item.label +"</a>" )
		.appendTo( ul );
	};
		
		
		
	});


