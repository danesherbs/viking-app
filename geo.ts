import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import * as Permissions from 'expo-permissions';
import { RADIUS_EARTH_KM, GPS_TIMEOUT_MILLISECONDS, MAY_SHOW_USER_SETTINGS_DIALOG } from './constants';


export type Angle = number;
export type Orientation = [Angle, Angle, Angle];
export type Position = [Angle, Angle];
export type Journey = [Position, Position];


const toRad = (degrees: number) => {
  return degrees * Math.PI / 180.0;
}

const toDeg = (radians: number) => {
  return radians * 180.0 / Math.PI;
}

const locationOptions = {
  accuracy: Location.Accuracy.BestForNavigation, 
  timeInterval: GPS_TIMEOUT_MILLISECONDS,
  mayShowUserSettingsDialog: MAY_SHOW_USER_SETTINGS_DIALOG
};

const requestLocationPermission = async () => {
  return await Permissions.askAsync(Permissions.LOCATION);
}

export const useLocation = () => {
  const [location, setLocation] = useState<Position>([0, 0]);

  requestLocationPermission();

  useEffect(() => {
    Location.watchPositionAsync(locationOptions,
      ({coords: {latitude, longitude}}) => {
        if (latitude !== null && longitude !== null) {
          setLocation([latitude, longitude]);
        }
      });
  }, []);

  return location;
};

export const useHeading = () => {
    const [heading, setHeading] = useState<Angle>(0);

    requestLocationPermission();
  
    useEffect(() => {
      Location.watchHeadingAsync(({trueHeading}) => {
        if (trueHeading !== -1) {
          setHeading(trueHeading);
        }
      });
    }, []);
  
    return heading;
};

export const haversineDistance = ([lat1, long1]: Position, [lat2, long2]: Position) => {
  return 2 * RADIUS_EARTH_KM * Math.asin(Math.sqrt(haversine(lat1-lat2) + Math.cos(lat1) * Math.cos(lat2) * haversine(long2-long1)));
}

const haversine = (radians: number) => {
  return (1 - Math.cos(radians)) / 2.0;
}

const newPosition = ([lat, long]: Position, [dy, dx]: Position) => {
  return [lat + dy / RADIUS_EARTH_KM, long + dx / RADIUS_EARTH_KM / Math.cos(lat)];
}

const degreesToTarget = (current: Position, finish: Position, orientation: Orientation) => {
  // eslint-disable-next-line
  const [alpha, ...rest] = orientation;
  if (current && finish) {
    const d = haversineDistance(current, finish);
    const other = newPosition(current, [d, 0]);
    const a = haversineDistance([other[0], other[1]], finish);  // TODO: refactor other
    const gamma = Math.acos((2*Math.pow(d, 2) -  Math.pow(a, 2)) / (2*Math.pow(d, 2)));
    if (finish[1])
    return toDeg((alpha - gamma) % (2 * Math.PI));
  }
  return toDeg(alpha);
}