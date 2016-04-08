import {Injectable, Inject, Injector, OnInit, NgZone} from "angular2/core";
import {Http, Response, Headers} from 'angular2/http';

import {Observable} from 'rxjs/Observable';
import {Observer} from 'rxjs/Observer';
import 'rxjs/add/operator/share';
import 'rxjs/add/operator/map';
import 'rxjs/Rx';

import {Segment} from '../interfaces/interface';
import {TemplateService} from '../templates/template.service';
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
	){
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

	getSegment(id: string) {
		return Promise.resolve(
			(this.segments.filter(segment => segment.id === id))[0]
		);
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
			segment => segment.start.month == month && segment.start.day == day && segment.start.year == year
		);

		segments = (segments.map((segment) => {
			segment.template = this.templateService.getTemplateSync(segment.template_id);
			return segment;
		})).filter((segment) => segment.template.user_id == id);

		return Promise.resolve(segments);
	}

	getNewSegment() {
		let date = new Date();
		let time = {
			day: date.getDate(),
			month: date.getMonth(),
			year: date.getFullYear(),
			hour: 1,
			minute: 0
		};

		let segment: Segment = {
			id: genId(),
			start: time,
			end: time,
			repeat: false,
			location: "",
			template_id: ""
		};

		return Promise.resolve(segment);
	}

	ngOnInit() {
	}
}








// end