var query = "" ;

$(document).keypress(function(event){
  var keycode = (event.keyCode ? event.keyCode : event.which);
  if(keycode == '13'){
          $("#button").click();
  }
});

function redrawTable() {
    //var query = $('#autocomplete').value();
    var query = $.map($('.tag span'),function(e,i){return $(e).text().trim();}).join(' ');

    window.location.hash = "#" + query ;
    $('#example').dataTable().fnDestroy();
    var qType = $('input[name="type"]:checked').val();
    var ontology = $("#ontology").text();

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
	    /*document.getElementById('pubmedsearchlink').href = "pubmed/?type="+qType+"&owlquery="+query+"&ontology="+ontology ;
	    $('#searchpubmed').show();                                                                                                         
	    document.getElementById('sparqlsearchlink').href = "sparql/?type="+qType+"&query="+query+"&ontology="+ontology ;
	    $('#searchsparql').show();                                                                                                         */
        },
        "ajax": {
            "url": "/api/runQuery.groovy?type="+qType+"&query="+query.trim()+"&ontology="+ontology+"&labels=true",
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
      ]
  })
    
  var q = window.location.hash.replace("#","");
  if (q!=null && q.length>0) {
          query = q ;
          redrawTable();
  }

  $( "#button" ).button();

  $('#autocomplete').tagsInput({
    'height': '40px',
    'width': '100%',
    'defaultText': '',
    'autocomplete_url': '',
    'autocomplete': {
      'source': function(request, response) {
        var ontology = $("#ontology").text();
        $.getJSON("/api/queryNames.groovy", {
            term: extractLast(request.term),
            ontology: ontology
        }, response);
      }
    },
    'autocomplete_renderitem': function(ul, item) {
      return $( "<li>" )
             .append( "<p>" + item.label +"</p> <p> <span style=\"float:left;font-size:9px\">" + item.iri + "</span>" +
              "<span style=\"font-size:9px;margin-left:20px;float:right;\"><b>"+item.ontology+"</b></span></p><br />")
             .appendTo(ul);
     }
  });
});

function split( val ) {
  return val.split( /\s/ );
}
function extractLast( term ) {
  return split( term ).pop();
}
