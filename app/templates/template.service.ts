import {Injectable, Injector, OnInit, NgZone} from "angular2/core";
import {Http, Response, Headers} from 'angular2/http';

import {Observable} from 'rxjs/Observable';
import {Observer} from 'rxjs/Observer';
import 'rxjs/add/operator/share';
import 'rxjs/add/operator/map';
import 'rxjs/Rx';

import {Template} from '../interfaces/interface';

var genId = () => {
	return Math.random().toString(36).substr(2, 9);
};

var TEMPLATES = [
	{
		id: genId(),
		name: "advising",
		interval: 15,
		allow_multiple: true,
		require_accept: true
	},
	{
		id: genId(),
		name: "Office hour",
		interval: 30,
		allow_multiple: true,
		require_accept: true
	}
];


@Injectable()
export class TemplateService implements OnInit {
	templates: Template[];

	templates$: Observable<Template[]>;
	private templatesObserver: Observer<Template[]>;

	constructor() {
		this.templates$ = new Observable<Template[]>(observer => this.templatesObserver = observer).share();

		let templates = localStorage.getItem('templates');
		if (typeof templates !== 'undefined' && templates !== null) {
			this.templates = JSON.parse(templates);
		} else {
			this.templates = TEMPLATES;
			localStorage.setItem('templates', JSON.stringify(this.templates));
		}
	}

	triggerObserve() {
		this.templatesObserver.next(this.templates);
	}

	getTemplate(id: string) {
		return Promise.resolve(
			(this.templates.filter(template => template.id === id))[0]
		);
	}

	addTemplate(template: Template) {
		let templates = localStorage.getItem('templates');
		if (typeof templates !== 'undefined' && templates !== null) {
			this.templates.push(template);
			localStorage.setItem('templates', JSON.stringify(this.templates));
		}
	}

	getNewTemplate() {
		let template: Template = {
			id: genId(),
			name: "",
			interval: 15,
			allow_multiple: false,
			require_accept: true
		};

		return Promise.resolve(template);
	}

	ngOnInit() {
	}
}








// end