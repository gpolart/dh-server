// =====================================================================
// Copyright Gilles Polart-Donat 2015
//
// Domohub is free software: you can redistribute it and/or modify
//    it under the terms of the GNU General Public License as published by
//    the Free Software Foundation, either version 3 of the License, or
//    (at your option) any later version.
//
//    Domohub is distributed in the hope that it will be useful,
//    but WITHOUT ANY WARRANTY; without even the implied warranty of
//    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//    GNU General Public License for more details.
//    You should have received a copy of the GNU General Public License
//    along with Domohub.  If not, see <http://www.gnu.org/licenses/>.
// ======================================================================
//

//
// Complement prototypes for system libs
//
Date.prototype.formatISO = function(fl_hour, fl_utc) {
	function zeroPad(n) {
		return (n < 10 ? '0' : '') + n;
	}

	var c;
	if (fl_utc === true) {
		c = this.getUTCFullYear() + '-' + zeroPad(this.getUTCMonth() + 1) + '-' + zeroPad(this.getUTCDate());
		if (fl_hour) {
			c += ' ' + zeroPad(this.getUTCHours()) + ':' + zeroPad(this.getUTCMinutes()) + ':' + zeroPad(this.getUTCSeconds());
		}
	}
	else {
		c = this.getFullYear() + '-' + zeroPad(this.getMonth() + 1) + '-' + zeroPad(this.getDate());
		if (fl_hour) {
			c += ' ' + zeroPad(this.getHours()) + ':' + zeroPad(this.getMinutes()) + ':' + zeroPad(this.getSeconds());
		}
	}

	return c;
}

$(document).ready(function() {

});
