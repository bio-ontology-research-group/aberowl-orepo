function groupBy( array , f )
{
  var groups = {};
  array.forEach( function( o )
  {
    var group = JSON.stringify( f(o) );
    groups[group] = groups[group] || [];
    groups[group].push( o );  
  });
  return Object.keys(groups).map( function( group )
  {
    return groups[group]; 
  })
}

function doSearch() {

  $( "#tabs" ).tabs({
    'activate': function(event, ui) {
      ui.newPanel.find('.dataTables_scrollHeadInner').css('width','100%');
      ui.newPanel.find('.table.table-striped.table-bordered.table-condensed.no-footer.dataTable').css('width','100%');
    }
  });
  $('#tabs').show();
  //(style='display:none;')
  $('#otabhead').text('Ontologies (loading...)');
  $('#mtabhead').text('DL Query (loading...)');
  $('#ctabhead').text('Classes (loading...)');

  $('#main_search').dataTable().fnDestroy();
  $('#manchester_search').dataTable().fnDestroy();
  $('#ontology_search').dataTable().fnDestroy();
    var query = $('#search').val();
    if (!query) {
	query = '' ;
    }
    window.location.hash = "!"+encodeURIComponent(query) ;
  // Class search by text
  var table = $('#main_search').dataTable( {
    "processing": false,
    "serverSide": false,
    "paging": true,
    "scrollY": 800,
    "renderer": "bootstrap",
    "aaSorting": [],
//    "aaSorting": [],
//    "order": [[ 0, 'asc' ]],
    "bAutoWidth": false,
    "iDisplayLength": 50,
    "bJQueryUI": false,
    "columnDefs": [
        { "visible": false, "targets": [0,1] }
    ],
    "drawCallback": function ( settings ) {
          var api = this.api();
          var rows = api.rows( {page:'current'} ).nodes();
          var last=null;
	  
          api.column(0, {page:'all'} ).data().each( function ( group, i ) {
              if ( last !== group ) {
                  $(rows).eq( i ).before(
//                      '<tr class="group"><td colspan="3">'+group+'</td></tr>'
                      '<tr class="group"><td colspan="3">'+group+'</td></tr>'
                  );
		  
                  last = group;
              }
          } );
      },
    "aoColumns" : [
      { "sWidth": "0%"},
      { "sWidth": "0%"},
      { "sWidth": "60%"},
      { "sWidth": "40%"}
    ],
      "ajax": {
          "url": "/service/api/queryNames.groovy?term=" + encodeURIComponent(query.trim()),
          "dataType": 'json',
          "dataSrc": function(result) {

            var datatable = new Array();
	    var rowcount = 0 ;
	    for (var m in result) {
		// group by IRI and sort by length of definition
		result[m] = groupBy(result[m], function(item) { return [item.iri] }) ;
		for (var iri in result[m]) {
		    result[m][iri] = result[m][iri].sort(function(a,b) {
			b.definition = b.definition || "" ;
			a.definition = a.definition || "" ;
			return b.definition.length - a.definition.length
		    }) ;
		}
		result[m] = result[m].sort(function(a,b) {
		    b[0].definition = b[0].definition || "" ;
		    a[0].definition = a[0].definition || "" ;
		    if (b.length - a.length === 0) {
			return b[0].definition.length - a[0].definition.length ;
		    } else {
			return b.length - a.length ;
		    }
		});
		for (var i in result[m]) {
		    var iri = result[m][i][0].iri ;
		    datatable[rowcount] = new Array() ;
		    datatable[rowcount][1] = '' ;
		    datatable[rowcount][0] = result[m][i][0].label + " (<small><tt>" + iri + "</tt></small>)" || result[m][i][0].oboid + " (<small><tt>" + iri + "</tt></small>)" || "<small><tt>" + iri + "</tt></small>";
		    datatable[rowcount][2] = result[m][i][0].definition || " " ;
		    datatable[rowcount][3] = "" ;
		    result[m][i] = result[m][i].sort(function(a,b) {
			return a.ontology.localeCompare(b.ontology) ;
		    });
		    for (var obj in result[m][i]) {
//			datatable[rowcount][1] += "<a href='/ontology/"+result[m][i][obj].ontology+"'>"+result[m][i][obj].ontology+"</a>, " ;
			datatable[rowcount][3] += "<a href='/ontology/"+result[m][i][obj].ontology+"#!"+encodeURIComponent(iri)+"'>"+result[m][i][obj].ontology+"</a>, " ;
		    }
//		    datatable[rowcount][1] = datatable[rowcount][1].substr(0,datatable[rowcount][1].length - 2);
		    datatable[rowcount][3] = datatable[rowcount][3].substr(0,datatable[rowcount][3].length - 2);
		    rowcount += 1;
		}
	    }
            $('#ctabhead').text('Classes ('+rowcount+')');
            return datatable;
          }
      },
    "dom": 'T<"clear">lfrtip',
    "tableTools": {
            "sSwfPath": "js/TableTools-2.0.0/media/swf/copy_csv_xls_pdf.swf"
        }
  });

  var table = $('#ontology_search').dataTable( {
    "processing": false,
    "serverSide": false,
    "paging": true,
    "scrollY": 800,
    "renderer": "bootstrap",
    "aaSorting": [[ 0, "asc" ]],
    "bAutoWidth": false,
    "iDisplayLength": 50,
    "bJQueryUI": false,
    "aoColumns" : [
      { "sWidth": "15%"},
      { "sWidth": "30%"},
      { "sWidth": "55%"}
    ],
      "fnInitComplete": function(oSettings, json) {
	  window.prerenderReady = true ;
      },
      "ajax": {
          "url": "/service/api/queryOntologies.groovy?term=" + encodeURIComponent(query.trim()),
          "dataType": 'json',
          "dataSrc": function(result) {
            $('#otabhead').text('Ontologies ('+result.length+')');

            var datatable = new Array();
            for( var i=0, ien=result.length ; i<ien ; i++ ) {
              datatable[i] = new Array() ;
              datatable[i][0] = "<a href='/ontology/"+result[i].uri+"'>"+result[i].uri+"</a>" ;
              datatable[i][1] = result[i].name;
              datatable[i][2] = result[i].description;
            }
            return datatable;
          }
      },
    "dom": 'T<"clear">lfrtip',
    "tableTools": {
            "sSwfPath": "js/TableTools-2.0.0/media/swf/copy_csv_xls_pdf.swf"
        }
  });

  var qType = $('input[name="type"]:checked').val();
  var mtable = $('#manchester_search').dataTable( {
    "processing": false,
    "serverSide": false,
    "paging": true,
    "scrollY": 800,
    "renderer": "bootstrap",
    "aaSorting": [[ 0, "asc" ]],
    "bAutoWidth": false,
    "iDisplayLength": 50,
    "bJQueryUI": false,
      "columnDefs": [
          { "visible": false, "targets": 0 }
      ],
    "aoColumns" : [
      { "sWidth": "15%"},
      { "sWidth": "15%"},
      { "sWidth": "30%"},
      { "sWidth": "40%"}
    ],
      "drawCallback": function ( settings ) {
          var api = this.api();
          var rows = api.rows( {page:'current'} ).nodes();
          var last=null;
	  
          api.column(0, {page:'current'} ).data().each( function ( group, i ) {
              if (!last || (last && last[0] !== group[0] )) {
                  $(rows).eq( i ).before(
                      '<tr class="group"><td colspan="3">'+group[0]+'</td></tr>'
                  );
		  
console.log(last);
                  last = group;
              }
          } );
      },
      "ajax": {
        "url": "/service/api/runQuery.groovy?type="+qType+"&labels=true&query="+encodeURIComponent(query.trim()),
        "dataType": 'json',
            "dataSrc": function ( json ) {
                var datatable = new Array();
                result = json.result;
                $('#mtabhead').text('DL Query ('+result.length+')');

                for ( var i=0, ien=result.length ; i<ien ; i++ ) {
                    datatable[i] = new Array() ;
                    datatable[i][2] = "<a href='/ontology/"+result[i].ontologyURI + "#!" +result[i].classURI+"'>"+result[i].classURI+"</a>" ;
                    datatable[i][1] = "<a href='/ontology/"+result[i].ontologyURI+"'>"+result[i].ontologyURI+"</a>" ;
                    datatable[i][0] = result[i].label || " " ;
                    datatable[i][3] = result[i].definition || " " ;
                }
                return datatable;
            }
      },
    "dom": 'T<"clear">lfrtip',
    "tableTools": {
            "sSwfPath": "js/TableTools-2.0.0/media/swf/copy_csv_xls_pdf.swf"
        }
  });
};

$(function() {
  $('#main_search').dataTable( {
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
  });

  $('#ontology_search').dataTable( {
      "processing": false,
      "serverSide": false,
      "paging": true,
      "scrollY": 400,
      aoColumns : [
          { "sWidth": "15%"},
          { "sWidth": "30%"},
          { "sWidth": "55%"}
      ]
  });

  $('#manchester_search').dataTable( {
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
  });

  console.log('adding');
  $("#search").keydown(function(event){
    if(event.keyCode == 13){
      $("#sbutton").click();
    }
  });
    console.log('added');
    var qstring = null ;
    if(window.location.hash) {
	qstring = decodeURIComponent(window.location.hash.substring(2)); // use 2 because we use #!
	if (qstring.length > 0) {
	    $('#search').val(qstring) ;
	    doSearch() ;
//	    window.prerenderReady = true ;
	}
    } else {
	window.prerenderReady = true ;
    }

});

window['doSearch'] = doSearch ;
