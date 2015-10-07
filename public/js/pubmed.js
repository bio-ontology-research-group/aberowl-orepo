function redrawPubmedTable() {
    //var query = $('#autocomplete').value();
    var query = $('#autocomplete').val();
//    var query = $.map($('#pubmed_autocomplete_tagsinput .tag span'),function(e,i){return '<'+uriMap[$(e).text().trim()]+'>';}).join(' ');

//    window.location.hash = "#" + query ;
    $('#pubmed_results').dataTable().fnDestroy();
    var qType = $('input[name="type"]:checked').val();
//    var ontology = $("#ontology_value").text();
    var ontology = window.location.pathname.replace("ontology/","").substr(1);

    var table = $('#pubmed_results').dataTable( {
        "processing": false,
        "serverSide": false,
	"paging": true,
	"scrollY": 400,
	"renderer": "bootstrap",
	"aaSorting": [[ 0, "asc" ]],
	"bAutoWidth": false,
	"iDisplayLength": 100,
	"bJQueryUI": true,
	aoColumns : [
	    { "sWidth": "20%"},
	    { "sWidth": "60%"}
	],
	"fnInitComplete": function( oSettings ) {
	    /*$('#pubmed').attr('href', "pubmed/?type="+qType+"&owlquery="+encodeURIComponent(query)+"&ontology="+ontology);
	    $('#pubmed').show();                                                                                                         
	    $('#sparql').attr('href', "sparql/?type="+qType+"&query="+encodeURIComponent(query)+"&ontology="+ontology);
	    $('#sparql').show();*/
        },
        "ajax": {
            "url": "/pubmed/?type="+qType+"&ontology="+ontology+"&labels=true&owlquery="+encodeURIComponent(query)+"&output=json",
	    "dataType": 'json',
            "dataSrc": function ( json ) {
                var datatable = new Array();
		var result = json;

                for (var i=0 ; i<result.length ; i++ ) {
                    datatable[i] = new Array() ;
                    if(result[i].pmcid) {
                      datatable[i][0] = '<a href="http://www.ncbi.nlm.nih.gov/pmc/articles/PMC'+result[i].pmcid+'">'+result[i].pmcid+' (full text)</a>';
                    } else if(result[i].pmid) {
                      datatable[i][0] = '<a href="http://www.ncbi.nlm.nih.gov/pubmed/'+result[i].pmid+'">'+result[i].pmid+'</a>';
                    }
                    datatable[i][0] = result[i].title;
                    if(result[i].pmcid) {
                      datatable[i][0] += '[<a href="http://www.ncbi.nlm.nih.gov/pmc/articles/PMC'+result[i].pmcid+'">PMC:'+result[i].pmcid+']</a> ';
                    }
		    if(result[i].pmid) {
                      datatable[i][0] += '[<a href="http://www.ncbi.nlm.nih.gov/pubmed/'+result[i].pmid+'">PMID:'+result[i].pmid+']</a>';
                    }
		    
                    datatable[i][1] = result[i].fragment;
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

$(function() {
  $('#pubmed_results').dataTable( {
      "processing": false,
      "serverSide": false,
      "paging": true,
      "scrollY": 400,
      aoColumns : [
          { "sWidth": "20%"},
          { "sWidth": "60%"}
      ]
  })

  $('#pubmed_autocomplete').autocomplete({
      'source': function(request, response) {
	  var ontology = window.location.pathname.replace("ontology/","").substr(1),
          query = extractLast(request.term);
          $.getJSON("/service/api/queryNames.groovy", {
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
  });
});

function split( val ) {
  return val.split( /\s/ );
}
function extractLast( term ) {
  return term.split('\'').pop();
}
