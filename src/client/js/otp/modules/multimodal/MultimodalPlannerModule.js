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

otp.namespace("otp.modules.multimodal");


otp.modules.multimodal.MultimodalPlannerModule = 
    otp.Class(otp.modules.planner.PlannerModule, {

    moduleName  : otp.config.locale.modules.multimodal.MultimodalPlannerModule.name,
    
    itinWidget  : null,
    
    showIntermediateStops : true,
    
    stopsWidget: true,
    
    routeData : null,
    
    initialize : function(webapp, id, options) {
        otp.modules.planner.PlannerModule.prototype.initialize.apply(this, arguments);
    },

    activate : function() {
        if(this.activated) return;
        otp.modules.planner.PlannerModule.prototype.activate.apply(this);

        // set up options widget
                
        var optionsWidgetConfig = {
        		title : 'TRIP PLANNER',
        		customHeader : true, // use a custom header
        		headerClass : 'otp-defaultTripWidget-header',
                closeable : false,
                minimizable : true,
                draggable : false,
                resizable : false,
                persistOnClose: true,
        };
        
        if(typeof this.tripOptionsWidgetCssClass !== 'undefined') {
            console.log("set tripOptionsWidgetCssClass: " + this.tripOptionsWidgetCssClass); 
            optionsWidgetConfig['cssClass'] = this.tripOptionsWidgetCssClass;
        }
        
        this.optionsWidget = new otp.widgets.tripoptions.TripOptionsWidget(
            'otp-'+this.id+'-optionsWidget', this, optionsWidgetConfig);

        if(this.webapp.geocoders && this.webapp.geocoders.length > 0) {
            this.optionsWidget.addControl("locations", new otp.widgets.tripoptions.LocationsSelector(this.optionsWidget, this.webapp.geocoders), true);
            this.optionsWidget.addVerticalSpace(12, true);
        }
                
        this.optionsWidget.addControl("time", new otp.widgets.tripoptions.TimeSelector(this.optionsWidget), true);
        this.optionsWidget.addVerticalSpace(12, true);
        
        
        var modeSelector = new otp.widgets.tripoptions.ModeSelector(this.optionsWidget);
        this.optionsWidget.addControl("mode", modeSelector, true);

        modeSelector.addModeControl(new otp.widgets.tripoptions.MaxWalkSelector(this.optionsWidget));
        modeSelector.addModeControl(new otp.widgets.tripoptions.MaxBikeSelector(this.optionsWidget));
        modeSelector.addModeControl(new otp.widgets.tripoptions.WheelChairSelector(this.optionsWidget));

        //modeSelector.addModeControl(new otp.widgets.tripoptions.BikeTriangle(this.optionsWidget));
        //modeSelector.addModeControl(new otp.widgets.tripoptions.PreferredRoutes(this.optionsWidget));
        //modeSelector.addModeControl(new otp.widgets.tripoptions.BannedRoutes(this.optionsWidget));
        //modeSelector.addModeControl(new otp.widgets.tripoptions.StartLocation(this.optionsWidget));
        modeSelector.refreshModeControls();

        this.optionsWidget.addSeparator();
        this.optionsWidget.addControl("submit", new otp.widgets.tripoptions.Submit(this.optionsWidget));
        
        this.optionsWidget.applyQueryParams(this.defaultQueryParams);
        
        //Add layers
        if(otp.config.showBullRunnerStops == true || otp.config.showHartBusStops == true){
        	this.stopsLayer = new otp.layers.StopsLayer(this);
        }
        if(otp.config.showBusPositions){
        	this.busLayers = new otp.layers.BusPositionsLayer(this);
        }
        
        if (otp.config.showBikeLanes) {
        	this.bikeLanes = new otp.layers.BikeLanesLayer(this);
        }

        if(otp.config.showBikeStations){
           	this.bikeLayers = new otp.layers.BikeStationsLayer(this);
        }

        // Layer Selector		
        this.layerWidget = new otp.widgets.LayersWidget('otp-'+this.id+'-layersWidget', this);		
                
        this.optionsWidget.minimize();
    },
    
    routesLoaded : function() {
        // set trip / stop viewer widgets
        
        this.tripViewerWidget = new otp.widgets.transit.TripViewerWidget("otp-"+this.id+"-tripViewerWidget", this);
        this.tripViewerWidget.center();
        
        this.stopViewerWidget = new otp.widgets.transit.StopViewerWidget("otp-"+this.id+"-stopViewerWidget", this);
        this.stopViewerWidget.center();

    },
    
    getExtendedQueryParams : function() {
        return { showIntermediateStops : this.showIntermediateStops };
    },
            
    processPlan : function(tripPlan, restoring) {
        if(this.itinWidget == null) {
            this.itinWidget = new otp.widgets.ItinerariesWidget(this.id+"-itinWidget", this);
        }
        if(restoring && this.restoredItinIndex) {
            this.itinWidget.show();
            this.itinWidget.updateItineraries(tripPlan.itineraries, tripPlan.queryParams, this.restoredItinIndex);
            this.restoredItinIndex = null;
        } else  {
            this.itinWidget.show();
            this.itinWidget.updateItineraries(tripPlan.itineraries, tripPlan.queryParams);
        }
        
        /*if(restoring) {
            this.optionsWidget.restorePlan(tripPlan);
        }*/
        this.drawItinerary(tripPlan.itineraries[0]);
    },
    
    restoreTrip : function(queryParams) {    
        this.optionsWidget.applyQueryParams(queryParams);
        otp.modules.planner.PlannerModule.prototype.restoreTrip.apply(this, arguments);
    },
       
    clearTrip : function() {
        otp.modules.planner.PlannerModule.prototype.clearTrip.apply(this);
        if(this.itinWidget !== null) {
            this.itinWidget.close();
            this.itinWidget.clear();
            this.itinWidget.setTitle(otp.config.locale.widgets.ItinerariesWidget.title);
        }
 },
        
    CLASS_NAME : "otp.modules.multimodal.MultimodalPlannerModule"
});
