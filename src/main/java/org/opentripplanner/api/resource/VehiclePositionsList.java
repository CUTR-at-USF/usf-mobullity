package org.opentripplanner.api.resource;

import java.util.ArrayList;
import java.util.List;

import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlElements;
import javax.xml.bind.annotation.XmlRootElement;

import org.opentripplanner.updater.vehiclepositions.Vehicle;

@XmlRootElement(name="VehiclePositionsList")
public class VehiclePositionsList {
    @XmlElements(value = { @XmlElement(name="vehicle") })
    public List<Vehicle> vehicles = new ArrayList<Vehicle>();
}