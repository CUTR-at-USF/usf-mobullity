package org.opentripplanner.index.model;

import java.util.Collection;
import java.util.List;

import org.onebusaway.gtfs.model.Route;
import org.opentripplanner.gtfs.GtfsLibrary;

import com.beust.jcommander.internal.Lists;

public class RouteShort {

    public String agency;
    public String id;
    public String shortName;
    public String longName;
    public String mode;
    public String color;
    
    public RouteShort (Route route) {
        agency = route.getId().getAgencyId();
        id = route.getId().getId();
        shortName = route.getShortName();
        longName = route.getLongName();
        mode = GtfsLibrary.getTraverseMode(route).toString();
        color = route.getColor();        
    }
    
    public static List<RouteShort> list (Collection<Route> in) {
        List<RouteShort> out = Lists.newArrayList();
        for (Route route : in) out.add(new RouteShort(route));
        return out;
    }    

}
