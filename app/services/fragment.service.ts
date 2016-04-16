import {Injectable, Injector, Inject, OnInit, NgZone} from "angular2/core";
import {Http, Response, Headers} from 'angular2/http';

import {Observable} from 'rxjs/Observable';
import {Observer} from 'rxjs/Observer';
import 'rxjs/add/operator/share';
import 'rxjs/add/operator/map';
import 'rxjs/Rx';

import {User, UserType, Fragment, Segment, Status} from '../interfaces/interface';
import {AuthService} from '../auth/auth.service';
import {SegmentService} from './segment.service';


export interface Notification {
	message: string,
	type: boolean
}

var genId = () => {
	return Math.random().toString(36).substr(2, 9);
};

export interface FragmentResponse {
	id: string,
	fragment: Fragment
}

@Injectable()
export class FragmentService {
	notification$: Observable<Notification>;
	private notificationObserver: Observer<Notification>;

	fragments$: Observable<Fragment[]>;
	private fragmentsObserver: Observer<Fragment[]>;

	fragment$: Observable<FragmentResponse>;
	private fragmentObserver: Observer<FragmentResponse>;

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

		this.notification$ = new Observable<Notification>(observer => this.notificationObserver = observer).share();
		this.fragments$ = new Observable<Fragment[]>(observer => this.fragmentsObserver = observer).share();
		this.fragment$ = new Observable<FragmentResponse>(observer => this.fragmentObserver = observer).share();
	}

	getFragments(segment) {
		return this.http.get(
			`${this.authService.baseUri}/fragments/${segment.id}`,
			{ headers: this.authService.getAuthHeader() }
		)
			.map(res => res.json())
			.toPromise();
	}

	merge(frags1: Fragment[], frags2: Fragment[]): Fragment[] {
		let fragments = frags1.map((fragment) => {
			let fg: Fragment = fragment;
			for (var i = frags2.length - 1; i >= 0; i--) {
				let tmp = frags2[i];
				if (tmp.start.hour == fragment.start.hour 
						&& fragment.start.minute == tmp.start.minute 
						&& fragment._segment == tmp._segment) {
					fg = tmp;
					break;
				}
			}
			return fg;
		});

		return fragments;
	}

	notifyFragment(fid: string, fragment: any) {
		let fg = fragment;
		fg.id = fg._id;
		delete fg._id;

		if (this.fragmentObserver) {
			if (!this.fragmentObserver.isUnsubscribed) {
				this.fragmentObserver.next({
					id: fid,
					fragment: fg
				});
			}
		}
	}

	addFragment(fragment: Fragment) {
		let { id, date, start, end, _segment, status, messages, responses, history } = fragment;

		let packet = {
			fid: id,
			date: date,
			start: start,
			end: end,
			_segment: _segment,
			status: status,
			messages: messages,
			responses: responses,
			history: history
		};

		this.http.post(
			`${this.authService.baseUri}/fragments/`,
			JSON.stringify(packet),
			{ headers: this.authService.getAuthHeader() })
		.map(res => res.json())
		.subscribe(
			(response: any) => {
				console.log(response);
				if (response.success) {
					this.notificationObserver.next({
						type: true,
						message: "Fragment has been created and updated"
					});

					let fg = response.payload;
					fg.id = fg._id;
					delete fg._id;
					fg.segment = fragment.segment;

					this.fragmentObserver.next({
						id: id,
						fragment: fg
					});

				} else {
					this.notificationObserver.next({
						type: false,
						message: "Sorry, something went wrong"
					});
					this.fragmentObserver.next({
						id: id,
						fragment: fragment
					});
				}
			});
	}

	updateFragment(fragment: Fragment) {
		if ('persistent' in fragment) {
			this.addFragment(fragment);
		} else {
			this.http.put(
				`${this.authService.baseUri}/fragments/${fragment.id}`,
				JSON.stringify(fragment),
				{ headers: this.authService.getAuthHeader() })
				.map(res => res.json())
				.subscribe(
					(response: any) => {
						console.log(response);
						if (response.success) {
							this.notificationObserver.next({
								type: true,
								message: "Fragment has been updated"
							});
						} else {
							this.notificationObserver.next({
								type: false,
								message: "Sorry, something went wrong"
							});
						}
					});
		}

		// let index = this.fragments.map(f => f.id).indexOf(fragment.id);
		// if (index >= 0 && index < this.fragments.length) {
		// 	this.fragments[index] = fragment;
		// 	localStorage.setItem('fragments', JSON.stringify(this.fragments));
		// 	return [true, fragment];
		// }
		// return [false, fragment];
		
	}

	genFragments (segment: Segment): Fragment[] {
		let [t1, m1] = [segment.start.hour, segment.start.minute],
				[t2, m2] = [segment.end.hour, segment.end.minute];

		let d1: any = new Date(segment.date.year, segment.date.month, segment.date.day, t1, m1),
				d2: any = new Date(segment.date.year, segment.date.month, segment.date.day, t2, m2);

		let diff = (d2 - d1) / 1000 / 60;
		let fragments = diff / segment.template.interval;

		let increment = ([h, m], inc): [number, number] => {
			if ((m + inc) === 60) {
				return [h + 1, 0];
			} else {
				return [h, m + inc];
			}
		}

		let frags: Fragment[] = [];
		let now: [number, number] = [t1, m1];
		for (let i = 0, l = fragments; i < l; i++) {
			let tmp = now;
			now = increment(now, 15);
			frags.push({
				id: `${segment.id}/${i}`,
				date: {
					year: segment.date.year,
					month: segment.date.month,
					day: segment.date.day
				},
				start: {
					hour: tmp[0],
					minute: tmp[1]
				},
				end: {
					hour: now[0],
					minute: now[1]
				},
				status: Status.default,
				segment: segment,
				_segment: segment.id,
				persistent: true
			});
		}

		return frags;
	}

	validateFragments(ts: Fragment[], sg: Segment) {
		let [_, session] = this.authService.getSession();
		let fragments = ts.map(
			fragment => {
				let unavailable = {
					id: Math.random().toString(36),
					date: fragment.date,
					start: fragment.start,
					end: fragment.end,
					segment_id: fragment._segment,
					status: Status.unavailable,
					segment: fragment.segment
				}

				if (fragment.status !== Status.default) {
					if (session.type == UserType.Faculty) {
						if (session.id == sg._user) {
							return fragment;
						} else {
							return unavailable;
						}
					} else {
						if (session.id == fragment._user) {
							return fragment;
						} else {
							return unavailable;
						}
					}
				} else {
					return fragment;
				}
			});

		return fragments;
	}

}






// end