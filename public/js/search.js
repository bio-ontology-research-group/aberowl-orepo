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
          { "visible": false, "targets": 0 }
      ],
      "drawCallback": function ( settings ) {
          var api = this.api();
          var rows = api.rows( {page:'current'} ).nodes();
          var last=null;
	  
          api.column(0, {page:'current'} ).data().each( function ( group, i ) {
              if ( last !== group ) {
                  $(rows).eq( i ).before(
                      '<tr class="group"><td colspan="3">'+group+'</td></tr>'
                  );
		  
                  last = group;
              }
          } );
      },
    "aoColumns" : [
      { "sWidth": "15%"},
      { "sWidth": "15%"},
      { "sWidth": "30%"},
      { "sWidth": "40%"}
    ],
      "ajax": {
          "url": "/service/api/queryNames.groovy?term=" + encodeURIComponent(query.trim()),
          "dataType": 'json',
          "dataSrc": function(result) {

            var datatable = new Array();
	    var rowcount = 0 ;
	    for (var m in result) {
		for (var i=0;i<result[m].length;i++){
//		for (var exp in result[m]){
//                for( var i=0, i=result.length ; i<ien ; i++ ) {
		    datatable[rowcount] = new Array() ;
		    datatable[rowcount][2] = "<a href='/ontology/"+result[m][i].ontology + "#!" + encodeURIComponent(result[m][i].iri) +"'>"+result[m][i].iri+"</a>" ;
		    datatable[rowcount][1] = "<a href='/ontology/"+result[m][i].ontology+"'>"+result[m][i].ontology+"</a>" ;
		    datatable[rowcount][0] = result[m][i].label || result[m][i].oboid ;
		    datatable[rowcount][3] = result[m][i].definition || " " ;
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
