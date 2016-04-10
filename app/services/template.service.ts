import {Injectable, Injector, Inject, OnInit, NgZone} from "angular2/core";
import {Http, Response, Headers} from 'angular2/http';

import {Observable} from 'rxjs/Observable';
import {Observer} from 'rxjs/Observer';
import 'rxjs/add/operator/share';
import 'rxjs/add/operator/map';
import 'rxjs/Rx';

import {Template, UserType} from '../interfaces/interface';

import {AuthService} from '../auth/auth.service';

var genId = () => {
	return Math.random().toString(36).substr(2, 9);
};


@Injectable()
export class TemplateService implements OnInit {
	templates: Template[];

	templates$: Observable<Template[]>;
	private templatesObserver: Observer<Template[]>;

	authService: AuthService;

	constructor(
		@Inject(AuthService) AuthService
	) {
		this.authService = AuthService;

		this.templates$ = new Observable<Template[]>(observer => this.templatesObserver = observer).share();

		let templates = localStorage.getItem('templates');
		if (typeof templates !== 'undefined' && templates !== null) {
			this.templates = JSON.parse(templates);
		} else {
			localStorage.setItem('templates', JSON.stringify([]));
		}
	}

	triggerObserve() {
		this.templatesObserver.next(this.templates);
	}

	getTemplates(id: string) {
		return Promise.resolve(
			this.templates.filter(template => template.user_id == id)
		);
	}

	getTemplate(id: string) {
		return Promise.resolve(
			(this.templates.filter(template => template.id === id))[0]
		);
	}

	getTemplateSync(id: string) {
		return (this.templates.filter(template => template.id === id))[0];
	}

	addTemplate(template: Template) {
		let [sessionExist, session] = this.authService.getSession();
		if (sessionExist) {
			if (session.type == UserType.Faculty && session.id) {
				let templates = localStorage.getItem('templates');
				if (typeof templates !== 'undefined' && templates !== null) {
					template.user_id = session.id;
					this.templates.push(template);
					localStorage.setItem('templates', JSON.stringify(this.templates));
				}
			}
		}
	}

	removeTemplate(id: string) {
		let index = this.templates.map(template => template.id).indexOf(id);
		if (index >= 0 && index < this.templates.length) {
			this.templates.splice(index, 1);
			localStorage.setItem('templates', JSON.stringify(this.templates));
			this.triggerObserve();
		}
	}

	getNewTemplate() {
		let template: Template = {
			id: genId(),
			name: "",
			interval: 15,
			allow_multiple: false,
			require_accept: true,
			user_id: ""
		};

		return Promise.resolve(template);
	}

	ngOnInit() {
	}
}








// end