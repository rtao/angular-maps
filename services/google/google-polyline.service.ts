import { ILatLong } from './../../interfaces/Ilatlong';
import { Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import { IPolylineOptions } from '../../interfaces/ipolylineoptions';
import { Polyline } from '../../models/polyline';
import { MapPolylineComponent } from './../../components/mappolyline';
import { PolylineService } from '../polylineservice';
import { MapService } from '../mapservice';
import { LayerService } from '../layerservice';
/**
 * Concrete implementation of the Polyline Service abstract class for Google Maps.
 *
 * @export
 * @class GooglePolylineService
 * @implements {PolylineService}
 */
@Injectable()
export class GooglePolylineService implements PolylineService {

    ///
    /// Field declarations
    ///
    private _polylines: Map<MapPolylineComponent, Promise<Polyline>> = new Map<MapPolylineComponent, Promise<Polyline>>();

    ///
    /// Constructor
    ///

    /**
     * Creates an instance of GooglePolylineService.
     * @param {MapService} _mapService - {@link MapService} instance. The concrete {@link GoogleMapService} implementation is expected.
     * @param {LayerService} _layerService - {@link GoolgeLayerService} instance.
     * The concrete {@link BingLayerService} implementation is expected.
     * @param {NgZone} _zone - NgZone instance to support zone aware promises.
     *
     * @memberof GooglePolylineService
     */
    constructor(private _mapService: MapService,
        private _layerService: LayerService,
        private _zone: NgZone) {
    }

    ///
    /// Public members and MarkerService implementation
    ///

    /**
     * Adds a polyline to a map. Depending on the polyline context, the polyline will either by added to the map or a
     * correcsponding layer.
     *
     * @param {MapPolylineComponent} polyline - The {@link MapPolylineComponent} to be added.
     *
     * @memberof GooglePolylineService
     */
    public AddPolyline(polyline: MapPolylineComponent): void {
        const o: IPolylineOptions = {
            id: polyline.Id,
            clickable: polyline.Clickable,
            draggable: polyline.Draggable,
            editable: polyline.Editable,
            geodesic: polyline.Geodesic,
            path: polyline.Path,
            strokeColor: polyline.StrokeColor,
            strokeOpacity: polyline.StrokeOpacity,
            strokeWeight: polyline.StrokeWeight,
            visible: polyline.Visible,
            zIndex: polyline.zIndex,
        }
        const polylinePromise: Promise<Polyline> = this._mapService.CreatePolyline(o);
        this._polylines.set(polyline, polylinePromise);
    }

    /**
      * Registers an event delegate for a marker.
      *
      * @template T - Type of the event to emit.
      * @param {string} eventName - The name of the event to register (e.g. 'click')
      * @param {MapPolylineComponent} polyline - The {@link MapPolylineComponent} for which to register the event.
      * @returns {Observable<T>} - Observable emiting an instance of T each time the event occurs.
      *
      * @memberof GooglePolylineService
      */
    public CreateEventObservable<T>(eventName: string, polyline: MapPolylineComponent): Observable<T> {
        return Observable.create((observer: Observer<T>) => {
            this._polylines.get(polyline).then((p: Polyline) => {
                p.AddListener(eventName, (e: T) => this._zone.run(() => observer.next(e)));
            });
        });
    }

    /**
      * Deletes a polyline.
      *
      * @param {MapPolylineComponent} polyline - {@link MapPolylineComponent} to be deleted.
      * @returns {Promise<void>} - A promise fullfilled once the polyline has been deleted.
      *
      * @memberof GooglePolylineService
      */
    public DeletePolyline(polyline: MapPolylineComponent): Promise<void> {
        const m = this._polylines.get(polyline);
        if (m == null) {
            return Promise.resolve();
        }
        return m.then((l: Polyline) => {
            return this._zone.run(() => {
                l.Delete();
                this._polylines.delete(polyline);
            });
        });

    };

    /**
     * Obtains geo coordinates for the marker on the click location
     *
     * @abstract
     * @param {(MouseEvent| any)} e - The mouse event.
     * @returns {ILatLong} - {@link ILatLong} containing the geo coordinates of the clicked marker.
     *
     * @memberof MarkerService
     */
    public GetCoordinatesFromClick(e: MouseEvent | any): ILatLong {
        if (!e) {
            return null;
        }
        if (!e.latLng) {
            return null;
        }
        if (!e.latLng.lat || !e.latLng.lng) {
            return null;
        }
        return { latitude: e.latLng.lat(), longitude: e.latLng.lng() };
    };

    /**
     * Obtains the marker model for the marker allowing access to native implementation functionatiliy.
     *
     * @param {MapPolylineComponent} polyline - The {@link MapPolylineComponent} for which to obtain the polyline model.
     * @returns {Promise<Polyline>} - A promise that when fullfilled contains the {@link Polyline}
     * implementation of the underlying platform.
     *
     * @memberof GooglePolylineService
     */
    public GetNativeMarker(polyline: MapPolylineComponent): Promise<Polyline> {
        return this._polylines.get(polyline);
    }

    /**
     * Set the polyline options.
     *
     * @param {MapPolylineComponent} polyline - {@link MapPolylineComponent} to be updated.
     * @param {IPolylineOptions} options - {@link IPolylineOptions} object containing the options. Options will be merged with the
     * options already on the underlying object.
     * @returns {Promise<void>} - A promise fullfilled once the polyline options have been set.
     *
     * @memberof GooglePolylineService
     */
    public SetOptions(polyline: MapPolylineComponent, options: IPolylineOptions): Promise<void> {
        return this._polylines.get(polyline).then((l: Polyline) => { l.SetOptions(options); });
    }

    /**
     * Updates the Polyline path
     *
     * @param {MapPolylineComponent} polyline - {@link MapPolylineComponent} to be updated.
     * @returns {Promise<void>} - A promise fullfilled once the polyline has been updated.
     *
     * @memberof GooglePolylineService
     */
    public UpdatePolyline(polyline: MapPolylineComponent): Promise<void> {
        const m = this._polylines.get(polyline);
        if (m == null) {
            return Promise.resolve();
        }
        return m.then((l: Polyline) => this._zone.run(() => { l.SetPath(polyline.Path); }));
    }

}
