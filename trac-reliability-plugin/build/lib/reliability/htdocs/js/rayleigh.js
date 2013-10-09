
function draw_rayleigh(table, tableContinue)
{
	if (table.length < 2) {
		document.getElementById("rayleigh_div").innerHTML = "Brak danych.";
		return;
	}

	linechart = new TSChartLib_LineChart();
	linechart.add_element(table, null, "rgba( 228, 255, 225, 0.5)", null, "green", 1);
	linechart.add_element(tableContinue, null, "rgba( 255, 0, 0, 0.1)", null, "red", 1);
	linechart.chartStyle = linechart.STYLE_FILLED;
	linechart.render( document.getElementById("rayleigh_chart"));

}

