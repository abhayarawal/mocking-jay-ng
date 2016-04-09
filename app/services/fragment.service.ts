import {Injectable, Injector, Inject, OnInit, NgZone} from "angular2/core";
import {Http, Response, Headers} from 'angular2/http';

import {Observable} from 'rxjs/Observable';
import {Observer} from 'rxjs/Observer';
import 'rxjs/add/operator/share';
import 'rxjs/add/operator/map';
import 'rxjs/Rx';

import {User, UserType, Fragment} from '../interfaces/interface';
import {AuthService} from '../auth/auth.service';
import {SegmentService} from './segment.service';


export interface Notification {
	message: string,
	type: boolean
}


@Injectable()
export class FragmentService {
	notification$: Observable<Notification>;
	private observer: Observer<Notification>;

	authService: AuthService;
	segmentService: SegmentService;

	fragments: Fragment[] = [];

	constructor(
		private http: Http,
		@Inject(AuthService) AuthService,
		@Inject(SegmentService) SegmentService
	) {
		this.segmentService = SegmentService;
		this.authService = AuthService;
		this.notification$ = new Observable<Notification>(observer => this.observer = observer).share();

		let fragments = localStorage.getItem('fragments');
		if (typeof fragments !== 'undefined' && fragments !== null) {
			this.fragments = JSON.parse(fragments);
		} else {
			localStorage.setItem('fragments', JSON.stringify([]));
		}
	}

	getFragments(segment, month, day, year) {
		let fragments = this.fragments
			.filter((fragment) =>
					fragment.segment_id == segment.id && fragment.date.month == month && fragment.date.day == day && fragment.date.year == year)
			.map((fragment) => {
				fragment.segment = segment;
				return fragment;
		});

		return Promise.resolve(fragments);
	}

	addFragment(fragment: Fragment) {
		let {id, date, start, end, segment_id, status} = fragment;
		// this.fragments.push({
		// 	id: id,
		// 	date: date,
		// 	start: start,
		// 	end: end,
		// 	segment_id: segment_id,
		// 	status: status
		// });
		// localStorage.setItem('fragments', JSON.stringify(this.fragments));
	}
}






// end