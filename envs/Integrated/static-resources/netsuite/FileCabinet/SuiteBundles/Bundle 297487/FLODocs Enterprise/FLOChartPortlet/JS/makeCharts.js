/* developed By Fabian de leon for FLOdocs */
var getJSON = function(url, successHandler, errorHandler) {
	var xhr = typeof XMLHttpRequest != 'undefined' ? new XMLHttpRequest()
			: new ActiveXObject('Microsoft.XMLHTTP');
	xhr.open('get', url, true);
	xhr.onreadystatechange = function() {
		var status;
		var data;
		// https://xhr.spec.whatwg.org/#dom-xmlhttprequest-readystate
		if (xhr.readyState == 4) { // `DONE`
			status = xhr.status;
			if (status == 200) {
				data = JSON.parse(xhr.responseText);
				successHandler && successHandler(data);
			} else {
				errorHandler && errorHandler(status);
			}
		}
	};
	xhr.send();
};

jQuery(document)
		.ready(
				function() {

					var page_params = getUrlVars(window.location.href);
					var json_url = unescape(page_params['json_url']);

					jQuery
							.ajax({
								url : 'https://' + location.hostname + json_url,
								type : "GET",
								dataType : "json",
								cache : true,
								success : function(msg) {
                                     console.log(msg)
									buildHtml(msg);
									buildIcons(msg);
									var interval = setInterval(function() {
										var element = parent.document
												.getElementsByClassName('chartIframes')[0]
												|| null;// parent.document.getElementById('my_iframe')||null;
										if (element) {
											clearInterval(interval);
											for (var i = 0; i < parent.document
													.getElementsByClassName('chartIframes').length; i++) {
												var element = parent.document
														.getElementsByClassName('chartIframes')[i];
												resizeIframe(element);
											}

										} else {
											setTimeout(function() {
												clearInterval(interval);
											}, 6000);
										}

									});

									renderFilters();

								}
							});

				})

function resizeIframe(obj) {
	if (obj.contentWindow.document.body.scrollHeight - 25 < 500) {
		obj.style.height = (obj.contentWindow.document.body.scrollHeight - 10)
				+ 'px';
	}
}

function createChart(data, ctx, type, searchId, title, legendId, filter) {

	if (!data) {
		// var id = ctx.canvas.id;
		var element = document.getElementById(legendId);
		element
				.insertAdjacentHTML('afterbegin',
						"<h5 width='100%' height='100'>No Data Found For The Selected Period</h5>");
		// ctx.canvas.outerHTML='<h5 width="100%" height="100">No Data Found For
		// The Selected Period</h5>';

		return;
	}
	;
	if (type == 'pie') {
		ctx.canvas.style.position = 'relative';
		ctx.canvas.style.bottom = 0;

	} else if (type == 'donut') {
		ctx.canvas.clientWidth = ctx.canvas.clientWidth - 30;
		ctx.canvas.clientHeight = ctx.canvas.clientHeight - 30;
		ctx.canvas.style.position = 'relative';
		data.options.legend = {
			position : 'top',
			display : false,
			fullWidth : true,
			padding : 1,
		}
		data.options.legendTemplate = "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li><div style='display:none;' class=\"comm-how\"><%=datasets[i].data[0]%>%</div><span style=\"background-color:<%=datasets[i].fillColor%>\"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>";
		data.type = "doughnut";
		ctx.canvas.height = ctx.canvas.height - 40;
		ctx.canvas.width = ctx.canvas.width - 40;
		var myPieChart = new Chart(ctx, data);
		myPieChart.chart.height = 100;

		var helpers = Chart.helpers;
		var legendHolder = document.getElementById(legendId)
		legendHolder.innerHTML = myPieChart.generateLegend();
		var elements = legendHolder.getElementsByTagName('li'); // Get
																// HTMLCollection
																// of elements
																// with the li
																// tag name.

		if (elements.length > 2) {

			for (var i = 0; i < elements.length; i++) {
				if (i <= elements.length - 5) {
					elements[i].style.display = "none";
				}

			}
		}
		return;

	} else {

		ctx.canvas.style.position = 'relative';
		ctx.canvas.style.bottom = 0;
	}

	// create each chart
	var config = {
		type : type,
		data : data,
		options : {
			legendTemplate : "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li><div class=\"comm-how\"><%= datasets[i].value %></div><span style=\"background-color:<%=datasets[i].fillColor%>\"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>",
			elements : {
				rectangle : {
					borderWidth : 2,
					borderColor : 'rgb(0, 255, 0)',
					borderSkipped : 'bottom'
				}
			},

			legend : {
				position : 'top',
				display : false,
				fullWidth : true,
				padding : 1,

			},

			title : {
				display : false,
				text : ''
			},
			scales : {
				xAxes : [ {
					display : false,
					min : 5,
					// backdropPaddingX:3,
					ticks : {
						autoSkip : true,
						maxTicksLimit : 5
					}
				} ]
			},
			responsive: true,
			multiTooltipTemplate : "<%= datasetLabel %> - <%= value %>",
			tooltips: {
				bodyFontSize: 9
			}
		}
	}

	ctx.canvas.height = ctx.canvas.height - 40;
	ctx.canvas.width = ctx.canvas.width - 40;
	var myPieChart = new Chart(ctx, config);
	myPieChart.chart.height = 100;
	var helpers = Chart.helpers;
	var legendHolder = document.getElementById(legendId)

	legendHolder.innerHTML = myPieChart.generateLegend();

	var elements = legendHolder.getElementsByTagName('li'); // Get
															// HTMLCollection of
															// elements with the
															// li tag name.

	if (elements && elements.length == 3) {
		var id = legendId.split("_")[1];
		var newId = "chart-area" + id;
		// document.getElementById(newId).setAttribute("style", "bottom:
		// -20px;");

	} else if (elements && elements.length == 2) {
		var id = legendId.split("_")[1];
		var newId = "chart-area" + id;
		// document.getElementById(newId).setAttribute("style", "bottom:
		// -44px;");
	} else if (elements && elements.length == 1) {
		var id = legendId.split("_")[1];
		var newId = "chart-area" + id;
		// document.getElementById(newId).setAttribute("style", "bottom:
		// -60px;");
	}

	if (elements.length > 2) {

		for (var i = 0; i < elements.length; i++) {
			if (i <= elements.length - 5) {
				elements[i].style.display = "none";
			}

		}
	}

}

function buildHtml(json) {

	for (var i = 0; i < json.arrayProcess.length; i++) {
		var counter = i + 1;
		var data = json.arrayProcess[i].data;
		var type = json.arrayProcess[i].type;
		var searchId = json.arrayProcess[i].searchId;
		var title = json.arrayProcess[i].title || "";
		var isOne = json.arrayProcess[i].simple;
		var filterDate = json.filter;
		var url_ss = "";
		if (searchId == "customsearch_flo_dashboard_changesbyty") {
			searchId = searchId + "_2";
		}

		if (filterDate && filterDate.length) {
			url_ss = "/app/common/search/searchresults.nl?searchid="
					+ searchId
					+ "&Custom_CREATEDrange=CUSTOM&Custom_CREATEDfrom="
					+ filterDate[0]
					+ "&Custom_CREATEDfromrel_formattedValue=&Custom_CREATEDfromrel=&Custom_CREATEDfromreltype=DAGO&Custom_CREATEDto="
					+ filterDate[1]
					+ "&Custom_CREATEDtorel_formattedValue=&Custom_CREATEDtorel=&Custom_CREATEDtoreltype=DAGO&style=NORMAL&Custom_CREATEDmodi=WITHIN&Custom_CREATED=CUSTOM&report=&grid=&searchid=7294&sortcol=Custom_FORMULATEXT_raw&sortdir=ASC&csv=HTML&OfficeXML=F&pdf=&size=500&twbx=F";

			if (searchId == 'customsearch_sod_risk_analysis_report_2') {
				url_ss = url_ss
						.replace(/Custom_CREATED/g, 'BCH_Custom_CREATED');
			}
		} else {
            try{
                
               if(parent.parent)
                var myDate = new Date();
                var stringDate = parent.parent.nlapiDateToString(myDate);
                var lastWeek = parent.parent.nlapiAddDays(myDate, -7);
                var lastWeekString = parent.parent.nlapiDateToString(lastWeek);

                url_ss = "/app/common/search/searchresults.nl?searchid="
                        + searchId
                        + "&Custom_CREATEDrange=CUSTOM&Custom_CREATEDfrom="
                        + lastWeekString
                        + "&Custom_CREATEDfromrel_formattedValue=&Custom_CREATEDfromrel=&Custom_CREATEDfromreltype=DAGO&Custom_CREATEDto="
                        + stringDate
                        + "&Custom_CREATEDtorel_formattedValue=&Custom_CREATEDtorel=&Custom_CREATEDtoreltype=DAGO&style=NORMAL&Custom_CREATEDmodi=WITHIN&Custom_CREATED=CUSTOM&report=&grid=&searchid=7294&sortcol=Custom_FORMULATEXT_raw&sortdir=ASC&csv=HTML&OfficeXML=F&pdf=&size=500&twbx=F";

                if (searchId == 'customsearch_sod_risk_analysis_report_2') {
                    url_ss = url_ss
                            .replace(/Custom_CREATED/g, 'BCH_Custom_CREATED');
                }
            }catch(e){

            }
			
		}

		if (!isOne) {
			var string = '<div id="canvas-holder" onclick="goToSS('
					+ "'"
					+ url_ss
					+ "'"
					+ ');" class="my_canvas_holder" style="width:31%;float:left;height:auto;text-align: center;margin-right:2%;margin-top:1%;margin-bottom:3%;cursor: pointer">';
			string += "<a style='font-size:14px;text-align: center;color:#255599;display: block; width: 100%; margin-bottom: 10px;' href='#' target='' >"
					+ title + "</a>"
			string += "<div class='mylegend' id='legend_" + counter
					+ "' style='display:none;' ></div>"
			string += "<div class='canvas_container' style='margin: 0px; padding: 0%; width: 100%;'>";
			string += '<div style="display: inline-block;text-align:center;"><canvas class="chart_' + type + '" id="chart-area'
					+ counter + '" width="80%" height="80" />';
			string += '</div></div>';
			string += '</div>';
		} else {
			if (data.datasets && data.datasets.length > 6) {
				var string = '<div id="canvas-holder" onclick="goToSS('
						+ "'"
						+ url_ss
						+ "'"
						+ ');" class="my_canvas_holder" style="width:31%;float:left;height:auto;text-align: center;margin-right:2%;margin-top:3%;margin-bottom:1%;cursor: pointer">';
				string += "<a style='font-size:14px;text-align: center;color:#255599;display: block; width: 100%; margin-bottom: 10px;' href='#' target='' >"
						+ title + "</a>"
				string += "<div class='mylegend' id='legend_" + counter
						+ "' style='display:none;' ></div>"
				string += "<div class='canvas_container' style='margin: 0px; padding: 0%; width: 100%;'>";
				string += '<div style="display: inline-block;text-align:center;"><canvas class="chart_' + type + '" id="chart-area'
						+ counter + '" width="100%" height="100" />';
				string += '</div></div>';
				string += '</div>';
			} else {
				var string = '<div id="canvas-holder" onclick="goToSS('
						+ "'"
						+ url_ss
						+ "'"
						+ ');" class="my_canvas_holder" style="width:31%;float:left;height:auto;text-align: center;margin-right:2%;margin-top:1%;margin-bottom:3%;cursor: pointer">';
				string += "<a style='font-size:14px;text-align: center;color:#255599;display: block; width: 100%; margin-bottom: 10px;' href='#' target='' >"
						+ title + "</a>"
				string += "<div class='mylegend' id='legend_" + counter
						+ "' style='display:none;'></div>"
				string += "<div class='canvas_container' style='margin: 0px; padding: 0%; width: 100%;'>";
				string += '<div style="display: inline-block;text-align:center;"><canvas class="chart_' + type + '" id="chart-area'
						+ counter + '" width="80%" height="80" />';
				string += '</div></div>';
				string += '</div>';
			}

		}

		var element = document.getElementById("canvas-place");
		element.insertAdjacentHTML('afterbegin', string);
		var ctx = document.getElementById("chart-area" + counter).getContext(
				"2d");
		var legendId = "legend_" + counter;

		createChart(data, ctx, type, searchId, title, legendId, filterDate);

	}
}

function goToSS(url_ss) {
	window.parent.open(url_ss, '_blank');
}

function filterPortlet() {
	showLoadingData();
	var datefrom = parent.document.getElementById("crit_1_from").value;
	var dateto = parent.document.getElementById("crit_1_to").value;
	var url = parent.nlapiResolveURL('SUITELET',
			'customscript_build_date_portlet_filter_d',
			'customdeploy_flo_portlet_filter_date', null)
			+ "&datefrom=" + datefrom + "&dateto=" + dateto;
	getJSON(url, function(data) {
		var account = data.url.split('c=')[1].split("&")[0];
		document.location.href = data.urlFolder + "?&json_url="
				+ escape(data.url);
		hideLoadingData();
	}, function(status) {

	});

	// renderFilters();

}
function hideLoadingData() {
	parent.Ext.MessageBox.hide();
}

function showLoadingData() {

	parent.Ext.MessageBox.show({
		msg : 'Processing your data, please wait...',
		progressText : 'Saving...',
		width : 300,
		wait : true,
		waitConfig : {
			interval : 200
		},
		icon : 'ext-mb-download', // custom class in msg-box.html
		animEl : 'body'
	});

}

function buildIcons(json) {
	try {
		if (json.icons && json.icons.length == 0 || !json.icons[0])
			return;
	} catch (e) {

		return;
	}

	for (var i = json.icons.length - 1; i >= 0; i--) {
		var counter = i + 1;
		var data = json.icons[i];

		string = '<li style="padding-left: 4%;"><a style="color:black;" target="_blank" href="'
				+ data.split(',')[1]
				+ '"><span class="glyphicon '
				+ data.split(',')[0] + '" aria-hidden="true" ></span></a>'
		string += '<a class="glyphicon-class" target="_blank" href="'
				+ data.split(',')[1] + '">' + data.split(',')[2] + '</a>'
		string += '</li>';

		var element = document.getElementById("insert_icons");
		element.insertAdjacentHTML('afterbegin', string);

	}

}

function getUrlVars(url) {
	var vars = [], hash;
	var hashes = url.slice(url.indexOf('?') + 1).split('&');
	for (var i = 0; i < hashes.length; i++) {
		hash = hashes[i].split('=');
		vars.push(hash[0]);
		vars[hash[0]] = hash[1];
	}
	return vars;
}

var myFunction = function() {
	parent.document.getElementById('crit_1_from_helper_calendar').click()
};

function addListener(element) {

	var classname = parent.document
			.getElementsByClassName("uir-popup-cal-cell-text");
	for (var i = 0; i < classname.length; i++) {
		classname[i].addEventListener('click', myFunction, false);
	}
	element.classList.remove("i_calendar_focus");
	element.classList.add("i_calendar");
}

function datesLess(d) {

	var myDate = new Date();// 11/16/2016
	var date = new Date(myDate.getFullYear(), myDate.getMonth(), myDate
			.getDate()
			- d);
	return parent.nlapiDateToString(date);
}

function moreDates(d) {
	var myDate = new Date();// 11/16/2016
	var date = new Date(myDate.getFullYear(), myDate.getMonth(), myDate
			.getDate()
			+ d);
	return parent.nlapiDateToString(date);
}

function renderFilters() {
	try {

		var myDate = new Date();// 11/16/2016
		var stringDate = parent.nlapiDateToString(myDate);
		var lastWeek = new Date(myDate.getFullYear(), myDate.getMonth(), myDate
				.getDate() - 7);
		var yesterday = new Date(myDate.getFullYear(), myDate.getMonth(),
				myDate.getDate() - 1);

		var lastWeekString = parent.nlapiDateToString(lastWeek);

		var firstDayMonth = new Date(myDate.getFullYear(), myDate.getMonth(), 1);
		var lastDayMonth = new Date(myDate.getFullYear(),
				myDate.getMonth() + 1, 0);
		var firstDayYear = new Date(myDate.getFullYear(), 0, 1);
		var lastDayYear = new Date(myDate.getFullYear(), 11, 31);
		var curr = new Date;
		var firstday = new Date(curr
				.setDate((curr.getDate() - curr.getDay()) + 1));
		var lastday = new Date(curr.setDate(curr.getDate() - curr.getDay() + 5));

		var currentDate1 = parent.document.getElementById("crit_1_from").value;
		var currentDate2 = parent.document.getElementById("crit_1_to").value;
		if (currentDate1 == '' && currentDate1 != stringDate) {
			parent.document.getElementById("crit_1_from").value = lastWeekString;
			parent.document.getElementById("crit_1_to").value = stringDate;
			// parent.document.getElementById("refresh").click();

		}

		parent.document.timeSelectors = {
			CUSTOM : {
				start : stringDate,
				end : stringDate
			},
			TODAY : {
				start : stringDate,
				end : stringDate
			},
			YESTERDAY : {
				start : datesLess(1),
				end : datesLess(1)
			},
			DAGO2 : {
				start : datesLess(2),
				end : stringDate
			},
			DAGO3 : {
				start : datesLess(3),
				end : stringDate
			},
			DAGO4 : {
				start : datesLess(4),
				end : stringDate
			},
			DAGO5 : {
				start : datesLess(5),
				end : stringDate
			},
			DAGO10 : {
				start : datesLess(10),
				end : stringDate
			},
			DAGO30 : {
				start : datesLess(30),
				end : stringDate
			},
			DAGO60 : {
				start : datesLess(60),
				end : stringDate
			},
			DAGO90 : {
				start : datesLess(90),
				end : stringDate
			},
			DFN2 : {
				start : '11/18/2017',
				end : '11/18/2017'
			},
			DFN3 : {
				start : '11/19/2017',
				end : '11/19/2017'
			},
			DFN4 : {
				start : '11/20/2017',
				end : '11/20/2017'
			},
			DFN5 : {
				start : '11/21/2017',
				end : '11/21/2017'
			},
			DFN10 : {
				start : '11/26/2017',
				end : '11/26/2017'
			},
			DFN30 : {
				start : '12/16/2017',
				end : '12/16/2017'
			},
			DFN60 : {
				start : '1/15/2017',
				end : '1/15/2017'
			},
			DFN90 : {
				start : '2/14/2017',
				end : '2/14/2017'
			},
			TOMORROW : {
				start : moreDates(1),
				end : moreDates(1)
			},
			OD : {
				start : '11/15/2017',
				end : '11/16/2017'
			},
			LW : {
				start : '11/6/2017',
				end : '11/12/2017'
			},
			LBW : {
				start : '11/7/2017',
				end : '11/13/2017'
			},
			LWTD : {
				start : '11/6/2017',
				end : '11/9/2017'
			},
			TW : {
				start : parent.nlapiDateToString(firstday),
				end : parent.nlapiDateToString(lastday)
			},
			TBW : {
				start : '11/14/2017',
				end : '11/20/2017'
			},
			TWTD : {
				start : '11/13/2017',
				end : '11/16/2017'
			},
			OW : {
				start : '11/10/2017',
				end : '11/16/2017'
			},
			NW : {
				start : '11/20/2017',
				end : '11/26/2017'
			},
			NBW : {
				start : '11/21/2017',
				end : '11/27/2017'
			},
			LM : {
				start : '10/1/2017',
				end : '10/31/2017'
			},
			LMTD : {
				start : '10/1/2017',
				end : '10/16/2017'
			},
			TMTD : {
				start : '11/1/2017',
				end : '11/16/2017'
			},
			TM : {
				start : parent.nlapiDateToString(firstDayMonth),
				end : parent.nlapiDateToString(lastDayMonth)
			},
			TODAYTTM : {
				start : '11/16/2017',
				end : '11/30/2017'
			},
			OM : {
				start : '10/17/2017',
				end : '11/16/2017'
			},
			NM : {
				start : '12/1/2017',
				end : '12/31/2017'
			},
			LY : {
				start : '1/1/2016',
				end : '12/31/2016'
			},
			LYTD : {
				start : '1/1/2016',
				end : '11/16/2016'
			},
			TY : {
				start : parent.nlapiDateToString(firstDayYear),
				end : parent.nlapiDateToString(lastDayYear)
			},
			TYTD : {
				start : '1/1/2017',
				end : '11/16/2017'
			},
			N4W : {
				start : '11/20/2017',
				end : '12/17/2017'
			},
			TWN3W : {
				start : '11/13/2017',
				end : '12/10/2017'
			},
			LFQ : {
				start : '7/1/2017',
				end : '9/30/2017'
			},
			LFQTD : {
				start : '7/1/2017',
				end : '8/16/2017'
			},
			TFQ : {
				start : '10/1/2017',
				end : '12/31/2017'
			},
			TFQTD : {
				start : '10/1/2017',
				end : '11/16/2017'
			},
			NFQ : {
				start : '1/1/2017',
				end : '3/31/2017'
			},
			LFH : {
				start : '1/1/2017',
				end : '6/30/2017'
			},
			LFHTD : {
				start : '1/1/2017',
				end : '5/16/2017'
			},
			TFH : {
				start : '7/1/2017',
				end : '12/31/2017'
			},
			TFHTD : {
				start : '7/1/2017',
				end : '11/16/2017'
			},
			NFH : {
				start : '1/1/2017',
				end : '6/30/2017'
			},
			LFY : {
				start : '1/1/2016',
				end : '12/31/2016'
			},
			LFYTD : {
				start : '1/1/2016',
				end : '11/16/2016'
			},
			TFY : {
				start : '1/1/2017',
				end : '12/31/2017'
			},
			TFYTD : {
				start : '1/1/2017',
				end : '11/16/2017'
			},
			TRQ : {
				start : '11/1/2017',
				end : '1/31/2017'
			},
			PRQ : {
				start : '9/1/2017',
				end : '11/30/2017'
			},
			LRQ : {
				start : '8/1/2017',
				end : '10/31/2017'
			},
			TRH : {
				start : '11/1/2017',
				end : '4/30/2017'
			},
			PRH : {
				start : '6/1/2017',
				end : '11/30/2017'
			},
			LRH : {
				start : '5/1/2017',
				end : '10/31/2017'
			},
			TRY : {
				start : '11/1/2017',
				end : '10/31/2017'
			},
			PRY : {
				start : '12/1/2016',
				end : '11/30/2017'
			},
			LRY : {
				start : '11/1/2016',
				end : '10/31/2017'
			},
			OQ : {
				start : '8/17/2017',
				end : '11/16/2017'
			},
			OH : {
				start : '5/17/2017',
				end : '11/16/2017'
			},
			OY : {
				start : '11/17/2016',
				end : '11/16/2017'
			},
			OYBL : {
				start : '11/17/2014',
				end : '11/16/2016'
			},
			NFY : {
				start : '1/1/2017',
				end : '12/31/2017'
			},
			NOW : {
				start : '11/17/2017',
				end : '11/23/2017'
			},
			NOM : {
				start : '11/17/2017',
				end : '12/16/2017'
			},
			NOQ : {
				start : '11/17/2017',
				end : '2/16/2017'
			},
			NOH : {
				start : '11/17/2017',
				end : '5/16/2017'
			},
			NOY : {
				start : '11/17/2017',
				end : '11/16/2017'
			},
			SMLFQ : {
				start : '8/1/2017',
				end : '8/31/2017'
			},
			SMLFY : {
				start : '11/1/2016',
				end : '11/30/2016'
			},
			SFQLFY : {
				start : '10/1/2016',
				end : '12/31/2016'
			},
			SWLFY : {
				start : '11/15/2016',
				end : '11/21/2016'
			},
			SDLW : {
				start : '11/9/2017',
				end : '11/9/2017'
			},
			SDWBL : {
				start : '11/2/2017',
				end : '11/2/2017'
			},
			SDLM : {
				start : '10/16/2017',
				end : '10/16/2017'
			},
			SDMBL : {
				start : '9/16/2017',
				end : '9/16/2017'
			},
			SDLFQ : {
				start : '8/16/2017',
				end : '8/16/2017'
			},
			SDFQBL : {
				start : '5/16/2017',
				end : '5/16/2017'
			},
			SDLFY : {
				start : '11/16/2016',
				end : '11/16/2016'
			},
			SFHLFY : {
				start : '7/1/2016',
				end : '12/31/2016'
			},
			SMFQBL : {
				start : '5/1/2017',
				end : '5/31/2017'
			},
			SMFYBL : {
				start : '11/1/2014',
				end : '11/30/2014'
			},
			SWFYBL : {
				start : '11/16/2014',
				end : '11/22/2014'
			},
			SDFYBL : {
				start : '11/16/2014',
				end : '11/16/2014'
			},
			SFQFYBL : {
				start : '10/1/2014',
				end : '12/31/2014'
			},
			SMLFQTD : {
				start : '8/1/2017',
				end : '8/16/2017'
			},
			SMLFYTD : {
				start : '11/1/2016',
				end : '11/16/2016'
			},
			SFQLFYTD : {
				start : '10/1/2016',
				end : '11/16/2016'
			},
			SFHLFYTD : {
				start : '7/1/2016',
				end : '11/16/2016'
			},
			WBL : {
				start : '10/30/2017',
				end : '11/5/2017'
			},
			MBL : {
				start : '9/1/2017',
				end : '9/30/2017'
			},
			WAN : {
				start : '11/27/2017',
				end : '12/3/2017'
			},
			MAN : {
				start : '1/1/2017',
				end : '1/31/2017'
			},
			FQBL : {
				start : '4/1/2017',
				end : '6/30/2017'
			},
			FHBL : {
				start : '7/1/2016',
				end : '12/31/2016'
			},
			FYBL : {
				start : '1/1/2014',
				end : '12/31/2014'
			},
			MB : {
				start : '8/1/2017',
				end : '8/31/2017'
			},
			FQB : {
				start : '1/1/2017',
				end : '3/31/2017'
			},
			FYB : {
				start : '1/1/2013',
				end : '12/31/2013'
			},
			MBTD : {
				start : '8/1/2017',
				end : '8/16/2017'
			},
			FQBTD : {
				start : '1/1/2017',
				end : '2/16/2017'
			},
			FYBTD : {
				start : '1/1/2013',
				end : '11/16/2013'
			},
			WBLTD : {
				start : '10/30/2017',
				end : '11/2/2017'
			},
			WANTD : {
				start : '11/27/2017',
				end : '11/30/2017'
			},
			MBLTD : {
				start : '9/1/2017',
				end : '9/16/2017'
			},
			MANTD : {
				start : '1/1/2017',
				end : '1/16/2017'
			},
			FQBLTD : {
				start : '4/1/2017',
				end : '5/16/2017'
			},
			FHBLTD : {
				start : '7/1/2016',
				end : '11/16/2016'
			},
			FYBLTD : {
				start : '1/1/2014',
				end : '11/16/2014'
			},
			LMLFQ : {
				start : '7/1/2017',
				end : '7/31/2017'
			},
			LMLFY : {
				start : '10/1/2016',
				end : '10/31/2016'
			},
			LFQLFY : {
				start : '7/1/2016',
				end : '9/30/2016'
			},
			LFHLFY : {
				start : '1/1/2016',
				end : '6/30/2016'
			},
			LMFQBL : {
				start : '4/1/2017',
				end : '4/30/2017'
			},
			LMFYBL : {
				start : '10/1/2014',
				end : '10/31/2014'
			},
			LFQFYBL : {
				start : '7/1/2014',
				end : '9/30/2014'
			},
			PMTFQ : {
				start : '10/1/2017',
				end : '10/31/2017'
			},
			PMLFQ : {
				start : '7/1/2017',
				end : '7/31/2017'
			},
			PMSFQLFY : {
				start : '10/1/2016',
				end : '10/31/2016'
			},
			PMTFH : {
				start : '7/1/2017',
				end : '10/31/2017'
			},
			PMLFH : {
				start : '1/1/2017',
				end : '4/30/2017'
			},
			PMSFHLFY : {
				start : '7/1/2016',
				end : '10/31/2016'
			},
			PMTFY : {
				start : '1/1/2017',
				end : '10/31/2017'
			},
			PMLFY : {
				start : '1/1/2016',
				end : '10/31/2016'
			},
			PQTFY : {
				start : '1/1/2017',
				end : '9/30/2017'
			},
			PQLFY : {
				start : '1/1/2016',
				end : '9/30/2016'
			}
		};
		parent.NS.jQuery(function() {
			var options = {
				"CUSTOM" : {
					value : "CUSTOM",
					text : "(Custom)",
					tagsCode : 0,
					favourite : false
				},
				/*
				 * "TODAY": { value: "TODAY", text: "today", tagsCode: 256,
				 * favourite: false },
				 */
				"YESTERDAY" : {
					value : "YESTERDAY",
					text : "yesterday",
					tagsCode : 256,
					favourite : false
				},
				"DAGO2" : {
					value : "DAGO2",
					text : "two days ago to date",
					tagsCode : 256,
					favourite : false
				},
				"DAGO3" : {
					value : "DAGO3",
					text : "three days ago to date",
					tagsCode : 256,
					favourite : false
				},
				"DAGO4" : {
					value : "DAGO4",
					text : "four days ago to date",
					tagsCode : 256,
					favourite : false
				},
				"DAGO5" : {
					value : "DAGO5",
					text : "five days ago to date",
					tagsCode : 256,
					favourite : false
				},
				"DAGO10" : {
					value : "DAGO10",
					text : "ten days ago to date",
					tagsCode : 256,
					favourite : false
				},
				"DAGO90" : {
					value : "DAGO90",
					text : "ninety days ago to date",
					tagsCode : 256,
					favourite : false
				},
				/*
				 * "TOMORROW": { value: "TOMORROW", text: "tomorrow", tagsCode:
				 * 256, favourite: false }, "LM": { value: "LM", text: "last
				 * month", tagsCode: 32, favourite: false }, "LW": { value:
				 * "LW", text: "last week", tagsCode: 128, favourite: false },
				 */
				"TW" : {
					value : "TW",
					text : "this week",
					tagsCode : 128,
					favourite : false
				},

				"TM" : {
					value : "TM",
					text : "this month",
					tagsCode : 32,
					favourite : false
				},
				"TY" : {
					value : "TY",
					text : "this year",
					tagsCode : 8,
					favourite : false
				}

			};

			var filters = {
				"day" : {
					value : "day",
					code : "256",
					text : "Day",
					selected : false
				},
				"week" : {
					value : "week",
					code : "192",
					text : "Week",
					selected : false
				},
				"month" : {
					value : "month",
					code : "32",
					text : "Month",
					selected : false
				},
				"year" : {
					value : "year",
					code : "9",
					text : "Year",
					selected : false
				}
			};
			var configuration = {
				disabled : false,
				labelCustom : "(Custom)",
				selectorServiceURL : "/app/common/timeselectors.nl",
				selectorType : "date"
			};

			parent.createTimeSelectorField("crit_1_mod-root", "crit_1_mod",
					options, filters, configuration);
		});
	} catch (e) {

	}
}
