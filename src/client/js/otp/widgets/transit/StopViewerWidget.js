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

otp.namespace("otp.widgets.transit");

otp.widgets.transit.StopViewerWidget = 
    otp.Class(otp.widgets.Widget, {

    module : null,

    agency_id : null,
    
    timeIndex : null,
    
        
    initialize : function(id, module) {
    
        otp.widgets.Widget.prototype.initialize.call(this, id, module, {
            title : 'Stop Viewer',
            cssClass : 'otp-stopViewer',
            closeable : true,
            resizable : true,
            openInitially : false,
            persistOnClose : true,
        });
        
        this.module = module;
        
        var this_ = this;

        this.activeTime = moment().unix() * 1000;
        
        this.stopFinder = new otp.widgets.transit.StopFinderWidget(this.module.id + "-stopFinder", this.module, this);

        ich['otp-stopViewer']({}).appendTo(this.mainDiv);
        
        this.timeList = this.mainDiv.find(".otp-stopViewer-timeList");
        this.stopInfo = this.mainDiv.find(".otp-stopViewer-stopInfo");
        
        var currentDate = new Date();
        this.datePicker = this.mainDiv.find(".otp-stopViewer-dateInput");
        this.datePicker.datepicker({
            onSelect: function(date) {
                var hrs = moment(this_.activeTime).hours();
                var mins = moment(this_.activeTime).minutes();
                this_.activeTime = moment(date).add('hours', hrs).add('minutes', mins).unix() * 1000;
                this_.clearTimes();
                this_.runTimesQuery();
            }
        });
        this.datePicker.datepicker("setDate", currentDate);
        
        this.mainDiv.find(".otp-stopViewer-findButton").click(function() {
            this_.stopFinder.show();
            this_.stopFinder.bringToFront();
        });
        
    },

    clearTimes : function() {
        this.times = null;
        this.timeIndex = null;
        this.timeList.empty();
    },
            
    setStop : function(agencyId, stopId, stopName) {
        this.agencyId = agencyId;
        this.stopId = stopId;
        this.clearTimes();
        this.stopInfo.html("<b>Stop:</b> " + stopName + " (" + agencyId + " #" + stopId + ")");
        this.runTimesQuery();
    },
    
    runTimesQuery : function() {
        var this_ = this;
        var startTime = moment(this.datePicker.val(), otp.config.locale.time.date_format).add("hours", -otp.config.timeOffset).unix();
        this.module.webapp.transitIndex.runStopTimesQuery(this.agencyId, this.stopId, startTime+10800, startTime+97200, this, function(data) {
            this_.times = [];
            var d = new Date();
            for(var i=0; i < data.length; i++) {
            	for(var t=0; t < data[i].times.length; t++) {
            		// Find time object given seconds since midnight
            		var time = moment([d.getYear()-100, d.getMonth(), d.getDate()]);
            		
            		time.add({"seconds": data[i].times[t].scheduledArrival});
            		
            		var time = {'arrival':time, 'trip':{'short':data[i].pattern.desc, 'long':data[i].pattern.id}};
            		this_.times.push(time);
            	}
            }
            this_.updateTimes();
        });        
    },
      
    updateTimes : function() {
        var minDiff = 1000000000;
        var bestIndex = 0;
        for(var i = 0; i < this.times.length; i++) {
            var time = this.times[i];            
            time.formattedTime = time.arrival.format(otp.config.timeFormat);
            ich['otp-stopViewer-timeListItem'](time).appendTo(this.timeList);
            console.log(time);
            var diff = Math.abs(this.activeTime - time.arrival.unix()*1000);
            if(diff < minDiff) {
                minDiff = diff;
                bestIndex = i;
            }
        }
        this.timeList.scrollTop(((bestIndex/this.times.length) * this.timeList[0].scrollHeight) - this.timeList.height()/2 + $(this.timeList.find(".otp-stopViewer-timeListItem")[0]).height()/2);
    },
    
    setActiveTime : function(activeTime) {
        this.activeTime = activeTime;
        this.datePicker.datepicker("setDate", new Date(activeTime));
    },
    
});
