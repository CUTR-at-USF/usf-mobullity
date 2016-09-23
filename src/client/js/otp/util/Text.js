/* This program is free software: you can redistribute it and/or
   modify it under the terms of the GNU Lesser General Public License
   as published by the Free Software Foundation, either version 3 of
   the License, or (at your option) any later version.
   
   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.
   
   You should have received a copy of the GNU General Public License
   along with this program.  If not, see <http://www.gnu.org/licenses/>. 
*/

otp.namespace("otp.util");

/**
 * Utility routines for text/string operations
 */
 
otp.util.Text = {

    capitalizeFirstChar : function(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },
    
    ordinal : function(n) {
        if(n > 10 && n < 14) return n+"th";
        switch(n % 10) {
            case 1: return n+"st";
            case 2: return n+"nd";
            case 3: return n+"rd";
        }
        return n+"th";
    },
    
    isNumber : function(str) {
        return !isNaN(parseFloat(str)) && isFinite(str);
    },
    
    endsWith : function(str, suffix) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    },
    
    constructUrlParamString : function(params) {
        var encodedParams = [];
        for(param in params) {
	    if (params[param] == undefined) continue; // skip unset or invalid parameters so OTP doesn't complain later
            encodedParams.push(param+"="+ encodeURIComponent(params[param]));
        }
        return encodedParams.join("&");
    },

    getUrlParameters : function() {
        var urlParams = null;
        urlParams = {};
        var match,
            pl     = /\+/g,  // Regex for replacing addition symbol with a space
            search = /([^&=]+)=?([^&]*)/g,
            decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
            query  = window.location.search.substring(1);
    
        while (match = search.exec(query))
            urlParams[decode(match[1])] = decode(match[2]);
        return urlParams;
    },

    // LZW functions adaped from jsolait library (LGPL)
    // via http://stackoverflow.com/questions/294297/javascript-implementation-of-gzip
    
    // LZW-compress a string
    lzwEncode : function(s) {
        var dict = {};
        var data = (s + "").split("");
        var out = [];
        var currChar;
        var phrase = data[0];
        var code = 256;
        for (var i=1; i<data.length; i++) {
            currChar=data[i];
            if (dict[phrase + currChar] != null) {
                phrase += currChar;
            }
            else {
                out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
                dict[phrase + currChar] = code;
                code++;
                phrase=currChar;
            }
        }
        out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
        for (var i=0; i<out.length; i++) {
            out[i] = String.fromCharCode(out[i]);
        }
        return out.join("");
    },

    // Decompress an LZW-encoded string
    lzwDecode : function(s) {
        var dict = {};
        var data = (s + "").split("");
        var currChar = data[0];
        var oldPhrase = currChar;
        var out = [currChar];
        var code = 256;
        var phrase;
        for (var i=1; i<data.length; i++) {
            var currCode = data[i].charCodeAt(0);
            if (currCode < 256) {
                phrase = data[i];
            }
            else {
               phrase = dict[currCode] ? dict[currCode] : (oldPhrase + currChar);
            }
            out.push(phrase);
            currChar = phrase.charAt(0);
            dict[code] = oldPhrase + currChar;
            code++;
            oldPhrase = phrase;
        }
        return out.join("");
    }
    
}

