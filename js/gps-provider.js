import {getState,setState} from './state.js';
import {BaseProvider,ProviderKind} from './provider-contracts.js';
import {classifyGpsAccuracy, isGpsFixFresh} from './gps-quality.js';

const errorName = code => ({1:'PERMISSION_DENIED',2:'POSITION_UNAVAILABLE',3:'TIMEOUT'})[code] || 'UNKNOWN';

/** Browser GPS provider. Live state is only published after valid browser coordinates arrive. */
export class BrowserGeolocationProvider extends BaseProvider {
  constructor(options = {}) {
    super({id:'browser-geolocation',kind:ProviderKind.GPS,live:true,offline:true});
    const {scheduler = globalThis, staleCheckIntervalMs = 5000, ...geoOptions} = options;
    this.options = {enableHighAccuracy:true,maximumAge:1000,timeout:5000,maxFixAgeMs:30000,...geoOptions};
    this.scheduler = scheduler;
    this.staleCheckIntervalMs = Number.isFinite(staleCheckIntervalMs) && staleCheckIntervalMs >= 250 ? staleCheckIntervalMs : 5000;
    this.watchId = null;
    this.staleMonitorId = null;
    this.last = null;
  }

  start() {
    if (this.watchId !== null) return true;
    const geo = globalThis.navigator?.geolocation;
    if (!geo || typeof geo.watchPosition !== 'function') {
      this.setUnavailable();
      return false;
    }
    try {
      this.watchId = geo.watchPosition(
        position => this.onPosition(position),
        error => this.onError(error),
        this.options
      );
      setState({gpsStatus:'GPS_SEARCHING',driverAssistance:{ready:false,source:this.id,isLive:false}});
      this.startStaleMonitor();
      return true;
    } catch (error) {
      this.watchId = null;
      this.onError({code:error?.code || 0, message:error?.message});
      return false;
    }
  }

  startStaleMonitor() {
    if (this.staleMonitorId !== null || typeof this.scheduler?.setInterval !== 'function') return false;
    this.staleMonitorId = this.scheduler.setInterval(() => this.markStale(), this.staleCheckIntervalMs);
    return true;
  }

  stopStaleMonitor() {
    if (this.staleMonitorId === null) return false;
    if (typeof this.scheduler?.clearInterval === 'function') {
      try { this.scheduler.clearInterval(this.staleMonitorId); } catch { /* shutdown remains deterministic */ }
    }
    this.staleMonitorId = null;
    return true;
  }

  stop() {
    this.stopStaleMonitor();
    const geo = globalThis.navigator?.geolocation;
    if (this.watchId !== null && typeof geo?.clearWatch === 'function') {
      try { geo.clearWatch(this.watchId); } catch { /* keep shutdown deterministic */ }
    }
    this.watchId = null;
    setState({gpsStatus:'GPS_STOPPED',driverAssistance:{ready:false,source:this.id,isLive:false}});
  }

  onPosition(position) {
    const c = position?.coords;
    const lat = c?.latitude, lng = c?.longitude;
    const now = Date.now();
    const fixTimestamp = Number.isFinite(position?.timestamp) ? position.timestamp : now;
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setState({gpsStatus:'GPS_ERROR_INVALID_POSITION',driverAssistance:{ready:false,source:this.id,isLive:false}});
      return false;
    }
    if (!isGpsFixFresh(fixTimestamp, now, this.options.maxFixAgeMs)) {
      setState({gpsStatus:'GPS_ERROR_STALE_POSITION',gpsQuality:'stale',driverAssistance:{ready:false,source:this.id,isLive:false}});
      return false;
    }
    this.last = {lat,lng,timestamp:fixTimestamp};
    this.lastFixAt = fixTimestamp;
    const accuracy = Number.isFinite(c.accuracy) && c.accuracy >= 0 ? c.accuracy : null;
    setState({
      currentLocation:{lat,lng},
      heading:Number.isFinite(c.heading) && c.heading >= 0 ? c.heading : 0,
      speed:Number.isFinite(c.speed) && c.speed >= 0 ? c.speed * 3.6 : 0,
      accuracy,
      gpsQuality:classifyGpsAccuracy(accuracy),
      gpsLastFixAt:fixTimestamp,
      gpsStatus:'LIVE_GPS',
      driverAssistance:{ready:true,source:this.id,isLive:true}
    });
    return true;
  }

  markStale(now = Date.now()) {
    const lastFixAt = this.last ? (Number.isFinite(this.last.timestamp) ? this.last.timestamp : null) : null;
    const stateFixAt = lastFixAt ?? this.lastFixAt ?? null;
    if (stateFixAt === null || isGpsFixFresh(stateFixAt, now, this.options.maxFixAgeMs)) return false;
    if (getState().gpsStatus === 'GPS_STALE') return false;
    setState({gpsStatus:'GPS_STALE',gpsQuality:'stale',driverAssistance:{ready:false,source:this.id,isLive:false}});
    return true;
  }

  onError(error = {}) {
    const status = `GPS_ERROR_${errorName(error.code)}`;
    setState({gpsStatus:status,driverAssistance:{ready:false,source:this.id,isLive:false}});
    return status;
  }

  setUnavailable() {
    this.watchId = null;
    setState({gpsStatus:'UNAVAILABLE',driverAssistance:{ready:false,source:this.id,isLive:false}});
  }
}
