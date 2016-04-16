import {Injectable, Injector, OnInit, NgZone} from "angular2/core";
import {Http, Response, Headers} from 'angular2/http';

import {Observable} from 'rxjs/Observable';
import {Observer} from 'rxjs/Observer';
import 'rxjs/add/operator/share';
import 'rxjs/add/operator/map';
import 'rxjs/Rx';

import {Fragment} from '../interfaces/interface';

@Injectable()
export class SegmentViewService {
	contextObservable$: Observable<Fragment>;
	private contextObserver: Observer<Fragment>;

	fragment: Fragment;

	constructor() {
		this.contextObservable$ = new Observable<Fragment>(observer => this.contextObserver = observer).share();
	}

	triggerContext(fragment: Fragment) {
		this.fragment = fragment;
		this.contextObserver.next(fragment);
	}
}