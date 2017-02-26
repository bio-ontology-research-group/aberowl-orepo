$(document).keypress(function(event){
  var keycode = (event.keyCode ? event.keyCode : event.which);
  if(keycode == '13'){
    $("#button").click();
  }
});

function redrawTable() {
    var query = $('#autocomplete').val();
//    var query = $.map($('#autocomplete_tagsinput .tag span'),function(e,i){var x = uriMap[$(e).text().trim()]; if(x != 'AND' && x != 'SOME'){ x='<'+x+'>'; } return x;}).join(' ');

    $('#example').dataTable().fnDestroy();
    var qType = $('input[name="type"]:checked').val();
    var ontology = window.location.pathname.replace("ontology/","").substr(1);

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
	    { "sWidth": "40%"}
	],
	"fnInitComplete": function( oSettings ) {
	    $('#pubmed').attr('href', "/aber-owl/pubmed/?type="+qType+"&owlquery="+encodeURIComponent(query)+"&ontology="+ontology);
	    $('#pubmed').show();                                                                                                         
	    $('#sparql').attr('href', "/aber-owl/sparql/?type="+qType+"&query="+encodeURIComponent(query)+"&ontology="+ontology);
	    $('#sparql').show();
        },
        "ajax": {
            "url": "/aberowl-test-service/api/runQuery.groovy?type="+qType+"&labels=true&query="+encodeURIComponent(query.trim())+"&ontology="+ontology,
	    "dataType": 'json',
            "dataSrc": function ( json ) {
                var datatable = new Array();
		$('#timer').text("Query took " + json.time + 'ms');
		result = json.result;

                for ( var i=0, ien=result.length ; i<ien ; i++ ) {
                    datatable[i] = new Array() ;
                    datatable[i][0] = "<a href='/ontology/"+result[i].ontologyURI + "?c=" +result[i].classURI+"'>"+result[i].classURI+"</a>" ;
                    datatable[i][1] = "<a href='/ontology/"+result[i].ontologyURI+"'>"+result[i].ontologyURI+"</a>" ;
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
};

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
          { "sWidth": "40%"}
      ]
  })
    
    var q = null ;window.location.hash.replace("#","");
  if (q!=null && q.length>0) {
          query = q ;
          redrawTable();
  }

  $( "#button" ).button();

  $('#autocomplete').autocomplete({
      'source': function(request, response) {
	  var ontology = window.location.pathname.replace("ontology/","").substr(1),
          query = extractLast(request.term);
          $.getJSON("/aberowl-test-service/api/queryNames.groovy", {
              term: query,
              ontology: ontology,
              prefix: true
          }, function(json) {
              response(Object.keys(json));
          });
      },
      'select': function(event, ui) {
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
  }).data( "ui-autocomplete" )._renderitem = function(ul, item) {
      var label = item.first_label || item.label || item.remainder || item.classURI;
      return $( "<li>" )
          .append( "<p>" + label +"</p> <p> <span style=\"float:left;font-size:9px\">" + item.iri + "</span>"+
		   "<span style=\"font-size:9px;margin-left:20px;float:right;\"><b>"+item.ontology+"</b></span></p><br />"+
		   "<span style='font-size:10px;color:#00B7FF;' onclick=\"window.location.href='/ontology/"+item.ontology+"/?c="+encodeURIComponent(item.iri)+"';\">[View in Ontology Browser]</a>")
          .appendTo(ul);
  };

});
function split( val ) {
  return val.split( /\s/ );
}
function extractLast( term ) {
  return term.split('\'').pop();
}
