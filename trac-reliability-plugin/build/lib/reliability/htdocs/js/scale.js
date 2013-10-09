
function black_pos_inside(y, m)
{
	beg_year = document.Form.scale_beg_year.value;
	end_year = document.Form.scale_end_year.value;
	black_beg_year = document.Form.scale_black_beg_year.value;
	black_end_year = document.Form.scale_black_end_year.value;
	black_beg_month = document.Form.scale_black_beg_month.value;
	black_end_month = document.Form.scale_black_end_month.value;

	if (	(y > black_beg_year && y < black_end_year) ||				// caly rok zawarty w przedziale
		(y == black_beg_year && black_beg_year != black_end_year && m >= black_beg_month) || 	// poczatek przedzialu
		(y == black_end_year && black_beg_year != black_end_year && m <= black_end_month) || 	// koniec przedzialu
		(y == black_beg_year && y == black_end_year && m >= black_beg_month && m <= black_end_month)) {
		return 1;
	}
	return 0;
}

function red_pos_inside(y, m)
{
	beg_year = document.Form.scale_beg_year.value;
	end_year = document.Form.scale_end_year.value;
	red_beg_year = document.Form.scale_red_beg_year.value;
	red_end_year = document.Form.scale_red_end_year.value;
	red_beg_month = document.Form.scale_red_beg_month.value;
	red_end_month = document.Form.scale_red_end_month.value;

	if (	(y > red_beg_year && y < red_end_year) ||				// caly rok zawarty w przedziale
		(y == red_beg_year && red_beg_year != red_end_year && m >= red_beg_month) || 	// poczatek przedzialu
		(y == red_end_year && red_beg_year != red_end_year && m <= red_end_month) || 	// koniec przedzialu
		(y == red_beg_year && y == red_end_year && m >= red_beg_month && m <= red_end_month)) {
		return 1;
	}
	return 0;
}

function html_black()
{
	beg_year = document.Form.scale_beg_year.value;
	end_year = document.Form.scale_end_year.value;
	beg_month = document.Form.scale_beg_month.value;
	end_month = document.Form.scale_end_month.value;

	t = "<td class=black>CZARNE:</td>";
	for (y = beg_year; y <= end_year; y++) {
		for (m = 1; m <= 12; m++) {
			if ((y == beg_year && m < beg_month) || (y == end_year && m > end_month)) {
				t += "<td class=scale_month_disabled>" + m + "</td>";
			}
			else {
				if (black_pos_inside(y, m) == 1) {
					t += "<td class=scale_month onclick=black_month_clicked(" + y + "," + m + ")>" + m + "</td>";

				} else {
					if (m != 12)
						t += "<td class=scale_month_inactive onclick=black_month_clicked(" + y + "," + m + ")>" + m + "</td>";
					else
						t += "<td class=scale_month12 onclick=black_month_clicked(" + y + "," + m + ")>" + m + "</td>";
				}
			}
		}
	}
	t += "</tr>";

	return t;
}

function html_red()
{
	beg_year = document.Form.scale_beg_year.value;
	end_year = document.Form.scale_end_year.value;
	beg_month = document.Form.scale_beg_month.value;
	end_month = document.Form.scale_end_month.value;

	t = "<td class=black>CZERWONE:</td>";
	for (y = beg_year; y <= end_year; y++) {
		for (m = 1; m <= 12; m++) {
			if ((y == beg_year && m < beg_month) || (y == end_year && m > end_month)) {
				t += "<td class=scale_month_disabled>" + m + "</td>";
			}
			else {
				if (red_pos_inside(y, m) == 1) {
					t += "<td class=scale_month onclick=red_month_clicked(" + y + "," + m + ")>" + m + "</td>";

				} else {
					if (m != 12)
						t += "<td class=scale_month_inactive onclick=red_month_clicked(" + y + "," + m + ")>" + m + "</td>";
					else
						t += "<td class=scale_month12 onclick=red_month_clicked(" + y + "," + m + ")>" + m + "</td>";
				}
			}
		}
	}
	t += "</tr>";

	return t;
}

/*
 * Nacisnieto na skali miesiac...
 */
function black_month_clicked(y, m)
{
	black_beg_year = document.Form.scale_black_beg_year.value;
	black_end_year = document.Form.scale_black_end_year.value;
	black_beg_month = document.Form.scale_black_beg_month.value;
	black_end_month = document.Form.scale_black_end_month.value;

	if (black_pos_inside(y, m) == 1) {
		// jak miesiac jest w aktywnym przedziale skali, to 
		// wszystkie poza nim zostaja nieaktywne
		document.Form.scale_black_beg_year.value = y;
		document.Form.scale_black_end_year.value = y;
		document.Form.scale_black_beg_month.value = m;
		document.Form.scale_black_end_month.value = m;
	}
	else {
		if (y < black_beg_year) {
			document.Form.scale_black_beg_year.value = y;
			document.Form.scale_black_beg_month.value = m;
		} else

		if (y > black_end_year) {
			document.Form.scale_black_end_year.value = y;
			document.Form.scale_black_end_month.value = m;
		} else

		if (y == black_beg_year && m < black_beg_month) {
			document.Form.scale_black_beg_month.value = m;
		} else

		if (y == black_end_year && m > black_end_month) {
			document.Form.scale_black_end_month.value = m;
		}
	}

	var tbody = document.getElementById("table_scale").getElementsByTagName("tbody")[0];
	var row1 = tbody.getElementsByTagName("tr")[1];
	row1.innerHTML = html_black();

//	document.myform.submit();
}

/*
 * Nacisnieto na skali miesiac...
 */
function red_month_clicked(y, m)
{
	red_beg_year = document.Form.scale_red_beg_year.value;
	red_end_year = document.Form.scale_red_end_year.value;
	red_beg_month = document.Form.scale_red_beg_month.value;
	red_end_month = document.Form.scale_red_end_month.value;

	if (red_pos_inside(y, m) == 1) {
		// jak miesiac jest w aktywnym przedziale skali, to 
		// wszystkie poza nim zostaja nieaktywne
		document.Form.scale_red_beg_year.value = y;
		document.Form.scale_red_end_year.value = y;
		document.Form.scale_red_beg_month.value = m;
		document.Form.scale_red_end_month.value = m;
	}
	else {
		if (y < red_beg_year) {
			document.Form.scale_red_beg_year.value = y;
			document.Form.scale_red_beg_month.value = m;
		} else

		if (y > red_end_year) {
			document.Form.scale_red_end_year.value = y;
			document.Form.scale_red_end_month.value = m;
		} else

		if (y == red_beg_year && m < red_beg_month) {
			document.Form.scale_red_beg_month.value = m;
		} else

		if (y == red_end_year && m > red_end_month) {
			document.Form.scale_red_end_month.value = m;
		}
	}

	var tbody = document.getElementById("table_scale").getElementsByTagName("tbody")[0];
	var row2 = tbody.getElementsByTagName("tr")[2];
	row2.innerHTML = html_red();

//	document.myform.submit();
}

function scale_table_print()
{
	beg_year = document.Form.scale_beg_year.value;
	end_year = document.Form.scale_end_year.value;
	beg_month = document.Form.scale_beg_month.value;
	end_month = document.Form.scale_end_month.value;

	t = "<table class=scale id=table_scale>";


	t += "<tr>";
	t += "<td class=black>Lata:</td>";
	for (y = beg_year; y <= end_year; y++) {
		t += "<td colspan=12 class=scale_year>" + y + "</td>";
	}
	t += "</tr>";


	t += "<tr>";
	t += html_black();
	t += "</tr>";


	t += "<tr>";
	t += html_red();
	t += "</tr>";

	
	t += "</table>";

	document.getElementById("scale_div").innerHTML = t;
}

function scale_append_version(name, count, checked, by, bm, ey, em)
{
	var tbody = document.getElementById("table_scale").getElementsByTagName("tbody")[0];

	var row = document.createElement("tr");

	var cell1 = document.createElement("td");
	cell1.setAttribute("class", "black");
	cell1.innerHTML = name + " [" + count + "]";
	cell1.innerHTML += "<input type=checkbox name=\"" + name + "_vr_checked\" " + checked + "\">"; 
	row.appendChild(cell1);

	for (y = beg_year; y <= end_year; y++) {
		for (m = 1; m <= 12; m++) {
			var cell1 = document.createElement("td");
			if ((by > y || ey < y) ||
				(by == y && m < bm) ||
				(ey == y && m > em)) {
				cell1.setAttribute("class", m != 12 ? "ver_inactive" : "ver12");

			}
			else {
				cell1.setAttribute("class", "ver_active");
				cell1.innerHTML = m;
			}
		
			row.appendChild(cell1);
		}
	}
	tbody.appendChild(row);
}
