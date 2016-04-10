import {Injectable, Inject, Injector, OnInit, NgZone} from "angular2/core";
import {Http, Response, Headers} from 'angular2/http';

import {Observable} from 'rxjs/Observable';
import {Observer} from 'rxjs/Observer';
import 'rxjs/add/operator/share';
import 'rxjs/add/operator/map';
import 'rxjs/Rx';

import {Segment} from '../interfaces/interface';
import {TemplateService} from './template.service';
import {AuthService} from '../auth/auth.service';

var genId = () => {
	return Math.random().toString(36).substr(2, 9);
};


@Injectable()
export class SegmentService implements OnInit {
	segments: Segment[] = [];

	segments$: Observable<Segment[]>;
	private segmentsObserver: Observer<Segment[]>;

	templateService: TemplateService;
	authService: AuthService;

	constructor(
		@Inject(TemplateService) TemplateService,
		@Inject(AuthService) AuthService
	) {
		this.templateService = TemplateService;
		this.authService = AuthService;

		this.segments$ = new Observable<Segment[]>(observer => this.segmentsObserver = observer).share();

		let segments = localStorage.getItem('segments');
		if (typeof segments !== 'undefined' && segments !== null) {
			this.segments = JSON.parse(segments);
		} else {
			localStorage.setItem('segments', "[]");
		}
	}

	triggerObserve() {
		this.segments = this.segments.map((segment) => {
			this.templateService.getTemplate(segment.template_id).then(template => {
				segment.template = template;
			});
			return segment;
		});
		this.segmentsObserver.next(this.segments);
	}

	getSegments(id: string) {
		return Promise.resolve(
			this.segments.filter(
				segment => segment.user_id == id).map(
					(segment) => {
						this.templateService.getTemplate(segment.template_id).then(template => {
							segment.template = template;
						});
						return segment;
			})
		);
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
		let segments = localStorage.getItem('segments');
		if (typeof segments !== 'undefined' && segments !== null) {
			this.segments.push(segment);
			localStorage.setItem('segments', JSON.stringify(this.segments));
		}
	}

	removeSegment(id: string) {
		let index = this.segments.map(segment => segment.id).indexOf(id);
		if (index >= 0 && index < this.segments.length) {
			this.segments.splice(index, 1);
			localStorage.setItem('segments', JSON.stringify(this.segments));
			this.triggerObserve();
		}
	}

	getSegmentsByRoute(id, month, day, year) {
		let segments = this.segments.filter(
			segment => segment.date.month == month && segment.date.day == day && segment.date.year == year
		);

		segments = (segments.map((segment) => {
			segment.template = this.templateService.getTemplateSync(segment.template_id);
			return segment;
		})).filter((segment) => segment.template.user_id == id);

		return Promise.resolve(segments);
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
			id: genId(),
			date: date,
			start: time,
			end: time,
			repeat: false,
			location: "",
			template_id: "",
			user_id: session.id
		};

		return Promise.resolve(segment);
	}

	ngOnInit() {
	}
}








// end