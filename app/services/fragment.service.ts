import {Injectable, Injector, Inject, OnInit, NgZone} from "angular2/core";
import {Http, Response, Headers} from 'angular2/http';

import {Observable} from 'rxjs/Observable';
import {Observer} from 'rxjs/Observer';
import 'rxjs/add/operator/share';
import 'rxjs/add/operator/map';
import 'rxjs/Rx';

import {User, UserType, Fragment, Segment, Status, InviteStatus} from '../interfaces/interface';
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


	getFragmentsFor(month, day, year) {
		return this.http.get(
			`${this.authService.baseUri}/fragments/${month}/${day}/${year}`,
			{ headers: this.authService.getAuthHeader() }
		)
			.map(res => res.json())
			.toPromise();
	}

	getSegmentArray(fid: string) {
		return this.http.get(
			`${this.authService.baseUri}/fragments/${fid}/details`,
			{ headers: this.authService.getAuthHeader() })
			.map(res => res.json())
			.toPromise();
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



	morphFragment(fragment: Fragment, _user: string): any {
		let [exists, session] = this.authService.getSession();
		if (_user == session.id) {
			return fragment;
		}

		if (!fragment._user) {
			if ('history' in fragment) {
				let valid: [boolean, number] = [false, -1];
				fragment.history.forEach((history, index) => {
					if (history._user == session.id) {
						valid = [true, index];
					}
				});
				if (valid[0]) {
					fragment.status = fragment.history[valid[1]].status;
					fragment.messages = fragment.history[valid[1]].messages;
				}
			}
			return fragment;
		}
		else if (fragment._user == session.id) {
			return fragment;
		} else {
			if ('invitees' in fragment) {
				var valid = false;
				fragment.invitees.forEach((invitee) => {
					if (invitee.email == session.email) {
						valid = true;
					}
				});

				if (valid && ([3, 4, 6].indexOf(fragment.status) < 0)) {
					fragment.messages = [];
					fragment.status = 7;
					return fragment;
				} else {
					fragment.status = 5;
					fragment.messages = [];
					fragment.history = [];
					return fragment;
				}
			} else {
				fragment.status = 5;
				fragment.messages = [];
				fragment.history = [];
				return fragment;
			}
		}
	}

	notifyFragment(fid: string, fragment: any, _user: string) {
		let fg = this.morphFragment(fragment, _user);
		fg.id = fg._id;
		delete fg._id;

		if (this.fragmentObserver) {
			if (!this.fragmentObserver.isUnsubscribed) {
				// console.log("fragment pushed", fg, fg._user);
				this.fragmentObserver.next({
					id: fid,
					fragment: fg
				});
			}
		}
	}

	updateInvitation(status: InviteStatus, fragment: Fragment) {
		this.http.patch(
			`${this.authService.baseUri}/fragments/${fragment.id}/invite`,
			JSON.stringify({status: status}),
			{ headers: this.authService.getAuthHeader() })
			.map(res => res.json())
			.retry(3)
			.subscribe(
				(response: any) => {
					this.notificationObserver.next({
						type: true,
						message: "Your invitation status has been updated"
					});
				});
	}

	addFragment(fragment: Fragment) {
		let { id, date, start, end, _segment, status, messages, message, history, invitees } = fragment;

		let packet = {
			fid: id,
			date: date,
			start: start,
			end: end,
			_segment: _segment,
			status: status,
			messages: messages,
			message: message,
			history: history,
			invitees: invitees
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
						message: response.message
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
			this.http.patch(
				`${this.authService.baseUri}/fragments/${fragment.id}`,
				JSON.stringify(fragment),
				{ headers: this.authService.getAuthHeader() })
				.map(res => res.json())
				.retry(3)
				.subscribe(
					(response: any) => {
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
					},
				(err) => {
					this.notificationObserver.next({
						type: false,
						message: "Sorry, could not connect to server"
					});
				});
		}
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
			now = increment(now, segment.template.interval);
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


	validateHistory(fragment: Fragment) {
		let [exists, session] = this.authService.getSession();
		if (exists && session.type == UserType.Student) {
			if ('history' in fragment) {
				let index = fragment.history.map((history) => history._user).indexOf(session.id);
				if (!(index < 0)) {
					let history = fragment.history[index];
					fragment.status = history.status;
					fragment.messages = history.messages;
					fragment._user = history._user;
				}
			}
		}
		return fragment;
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

	getToday(month, day, year) {
		return this.http.get(
			`${this.authService.baseUri}/fragments/${month}/${day}/${year}`,
			{ headers: this.authService.getAuthHeader() }
		)
			.map(res => res.json())
			.toPromise();
	}

}






// end