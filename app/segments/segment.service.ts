import {Injectable, Injector, OnInit, NgZone} from "angular2/core";
import {Http, Response, Headers} from 'angular2/http';

import {Observable} from 'rxjs/Observable';
import {Observer} from 'rxjs/Observer';
import 'rxjs/add/operator/share';
import 'rxjs/add/operator/map';
import 'rxjs/Rx';

import {Segment} from '../interfaces/interface';

var genId = () => {
	return Math.random().toString(36).substr(2, 9);
};


@Injectable()
export class SegmentService implements OnInit {
	segments: Segment[] = [];

	segments$: Observable<Segment[]>;
	private segmentsObserver: Observer<Segment[]>;

	constructor() {
		this.segments$ = new Observable<Segment[]>(observer => this.segmentsObserver = observer).share();

		let segments = localStorage.getItem('segments');
		if (typeof segments !== 'undefined' && segments !== null) {
			this.segments = JSON.parse(segments);
		} else {
			localStorage.setItem('segments', "[]");
		}
	}

	triggerObserve() {
		this.segmentsObserver.next(this.segments);
	}

	getTemplate(id: string) {
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
		if (index > 0 && index < this.segments.length) {
			this.segments.splice(index, 1);
			localStorage.setItem('segments', JSON.stringify(this.segments));
			this.triggerObserve();
		}
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
			location: ""
		};

		return Promise.resolve(segment);
	}

	ngOnInit() {
	}
}








// end