import {Injectable, Inject, Injector, OnInit, NgZone} from "angular2/core";
import {Http, Response, Headers} from 'angular2/http';

import {Observable} from 'rxjs/Observable';
import {Observer} from 'rxjs/Observer';
import 'rxjs/add/operator/share';
import 'rxjs/add/operator/map';
import 'rxjs/Rx';

import {Segment, UserType} from '../interfaces/interface';
import {TemplateService} from './template.service';
import {AuthService} from '../auth/auth.service';

var genId = () => {
	return Math.random().toString(36).substr(2, 9);
};

export interface Notification {
	message: string,
	type: boolean
}


@Injectable()
export class SegmentService implements OnInit {
	segments: Segment[] = [];

	segments$: Observable<Segment[]>;
	private segmentsObserver: Observer<Segment[]>;

	notification$: Observable<Notification>;
	private notificationObserver: Observer<Notification>;

	templateService: TemplateService;
	authService: AuthService;

	getSegmentsPending;

	constructor(
		private http: Http,
		@Inject(TemplateService) TemplateService,
		@Inject(AuthService) AuthService
	) {
		this.templateService = TemplateService;
		this.authService = AuthService;

		this.segments$ = new Observable<Segment[]>(observer => this.segmentsObserver = observer).share();
		this.notification$ = new Observable<Notification>(observer => this.notificationObserver = observer).share();


		let segments = localStorage.getItem('segments');
		if (typeof segments !== 'undefined' && segments !== null) {
			this.segments = JSON.parse(segments);
		} else {
			localStorage.setItem('segments', "[]");
		}
	}

	triggerObserve() {
		// this.segments = this.segments.map((segment) => {
		// 	this.templateService.getTemplate(segment.template_id).then(template => {
		// 		segment.template = template;
		// 	});
		// 	return segment;
		// });
		// this.segmentsObserver.next(this.segments);
	}

	getSegments(id: string, month?, day?, year?) {
		let templates$ = this.templateService.templates$;

		if (this.getSegmentsPending) {
			this.getSegmentsPending.unsubscribe();
		}

		this.getSegmentsPending = templates$.subscribe(
			(templates) => {
				let headers = this.authService.getAuthHeader();
				let uri;

				if (month && day && year) {
					uri = `${this.authService.baseUri}/segments/${id}/${month}/${day}/${year}`;
				} else {
					uri = `${this.authService.baseUri}/segments/${id}`;
				}

				this.http.get(uri, {
					headers: headers,
				})
				.map(response => response.json())
				.subscribe(
					(response) => {
						let segments = response.map((segment) => {
							segment.id = segment._id;

							templates.forEach((template) => {
								if (template.id == segment._template) {
									segment.template = template;
								}
							});

							delete segment._id;
							return segment;
						});

						this.segmentsObserver.next(segments);
					},
					err => {
						this.notificationObserver.next({
							type: false,
							message: 'Error connecting to server'
						})
					});

			});

		this.templateService.getTemplates(id);

		// return Promise.resolve(
		// 	this.segments.filter(
		// 		segment => segment.user_id == id).map(
		// 			(segment) => {
		// 				this.templateService.getTemplate(segment.template_id).then(template => {
		// 					segment.template = template;
		// 				});
		// 				return segment;
		// 	})
		// );
	}

	getSegment(id: string) {
		return Promise.resolve(
			(this.segments.filter(segment => segment.id === id))[0]
		);
	}

	getSegmentSync(id: string) {
		return (this.segments.filter(segment => segment.id === id))[0];
	}

	addSegment(segment: any) {
		let [sessionExist, session] = this.authService.getSession();
		if (sessionExist) {
			if (session.type == UserType.Faculty && session.id) {
				let authHeader = this.authService.getAuthHeader();

				this.http.post(`${this.authService.baseUri}/segments/`, JSON.stringify(segment), {
					headers: authHeader
				})
					.map(res => res.json())
					.subscribe(
					(data) => {
						if (data.success) {
							this.notificationObserver.next({
								message: 'Template has been saved',
								type: true
							});
						} else {
							this.notificationObserver.next({
								message: 'Could not save segment',
								type: false
							});
						}
					},
					err => {
						this.notificationObserver.next({
							message: 'Error connecting to server',
							type: false
						});
					});
			}
		}
	}

	removeSegment(id: string) {
		let [sessionExist, session] = this.authService.getSession();
		if (sessionExist) {
			let authHeaders = this.authService.getAuthHeader();
			this.http.delete(`${this.authService.baseUri}/segments/${id}`, {
				headers: authHeaders
			})
				.map(res => res.json())
				.subscribe(
				(response) => {
					if (response.success) {
						this.notificationObserver.next({
							type: true,
							message: 'Segment has been removed'
						});
						this.getSegments(session.id);
					} else {
						this.notificationObserver.next({
							type: false,
							message: 'Could not remove segment'
						});
					}
				},
				err => {
					this.notificationObserver.next({
						type: false,
						message: 'Error connecting to server'
					});
				});
		}

		// let index = this.segments.map(segment => segment.id).indexOf(id);
		// if (index >= 0 && index < this.segments.length) {
		// 	this.segments.splice(index, 1);
		// 	localStorage.setItem('segments', JSON.stringify(this.segments));
		// 	this.triggerObserve();
		// }
	}

	getSegmentsByRoute(id, month, day, year) {
		this.getSegments(id, month, day, year);

		// let segments = this.segments.filter(
		// 	segment => segment.date.month == month && segment.date.day == day && segment.date.year == year
		// );

		// segments = (segments.map((segment) => {
		// 	segment.template = this.templateService.getTemplateSync(segment._template);
		// 	return segment;
		// })).filter((segment) => segment.template._user == id);

		// return Promise.resolve(segments);
	}

	getNewSegment() {
		let d = new Date();

		let date = {
			day: d.getDate(),
			month: d.getMonth(),
			year: d.getFullYear()
		}

		let time = {
			hour: 1,
			minute: 0
		};

		let [_, session] = this.authService.getSession();

		let segment: Segment = {
			id: "",
			date: date,
			start: time,
			end: time,
			repeat: false,
			location: "",
			_template: "",
			_user: session.id
		};

		return Promise.resolve(segment);
	}

	ngOnInit() {
	}
}








// end